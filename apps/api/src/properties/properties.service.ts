import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { FilesService } from '../storage/files.service.js';
import type { CreatePropertyDto } from './dto/create-property.dto.js';
import type { SearchPropertiesDto } from './dto/search-properties.dto.js';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
  ) {}

  async listPublished(query: SearchPropertiesDto) {
    return this.prisma.property.findMany({
      where: {
        published: true,
        status: 'AVAILABLE',
        city: query.city ? { contains: query.city, mode: 'insensitive' } : undefined,
        monthlyRent: query.maxRent ? { lte: query.maxRent } : undefined,
        OR: query.search
          ? [
              { title: { contains: query.search, mode: 'insensitive' } },
              { neighborhood: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async featured() {
    return this.prisma.property.findMany({
      where: { published: true, status: 'AVAILABLE' },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const property = await this.prisma.property.findFirst({
      where: { slug, published: true },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!property) throw new NotFoundException('Inmueble no encontrado.');
    return property;
  }

  listAdmin() {
    return this.prisma.property.findMany({
      include: { images: { orderBy: { sortOrder: 'asc' } }, _count: { select: { leases: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePropertyDto, administratorId: string, files: Express.Multer.File[], tour360File?: Express.Multer.File) {
    const slug = await this.uniqueSlug(dto.title);
    const features = dto.features
      ? dto.features.split(',').map((feature) => feature.trim()).filter(Boolean)
      : [];
    const uploadedFiles = await this.files.uploadPropertyImages(files, administratorId);
    const uploadedTour360 = tour360File
      ? await this.files.uploadProperty360(tour360File, administratorId)
      : null;
    const uploadedAssets = uploadedTour360 ? [...uploadedFiles, uploadedTour360] : uploadedFiles;
    try {
      return await this.prisma.property.create({
        data: {
          title: dto.title.trim(),
          slug,
          description: dto.description.trim(),
          monthlyRent: dto.monthlyRent,
          administrationFee: dto.administrationFee,
          deposit: dto.deposit,
          city: dto.city.trim(),
          neighborhood: dto.neighborhood.trim(),
          address: dto.address.trim(),
          bedrooms: dto.bedrooms,
          bathrooms: dto.bathrooms,
          areaM2: dto.areaM2,
          parking: dto.parking,
          features,
          tour360Url: uploadedTour360?.publicPath,
          videoUrl: this.optionalText(dto.videoUrl),
          published: dto.published ?? true,
          createdById: administratorId,
          images: {
            create: uploadedFiles.map((file, index) => ({
              url: file.publicPath,
              alt: dto.title,
              sortOrder: index,
            })),
          },
        },
        include: { images: true },
      });
    } catch (error) {
      await this.files.removeStoredFiles(uploadedAssets);
      throw error;
    }
  }

  async addImages(propertyId: string, files: Express.Multer.File[]) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId }, include: { images: true } });
    if (!property) throw new NotFoundException('Inmueble no encontrado.');
    const uploadedFiles = await this.files.uploadPropertyImages(files);
    try {
      await this.prisma.propertyImage.createMany({
        data: uploadedFiles.map((file, index) => ({
          propertyId,
          url: file.publicPath,
          alt: property.title,
          sortOrder: property.images.length + index,
        })),
      });
    } catch (error) {
      await this.files.removeStoredFiles(uploadedFiles);
      throw error;
    }
    return this.prisma.property.findUnique({ where: { id: propertyId }, include: { images: true } });
  }

  async remove(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        images: { select: { url: true } },
        leases: { select: { id: true } },
      },
    });
    if (!property) throw new NotFoundException('Inmueble no encontrado.');

    const publicPaths = [
      ...property.images.map((image) => image.url),
      property.tour360Url,
    ].filter((value): value is string => Boolean(value?.startsWith('/api/files/')));

    const storedFiles = publicPaths.length > 0
      ? await this.prisma.storedFile.findMany({
          where: { publicPath: { in: publicPaths } },
          select: { id: true, objectKey: true },
        })
      : [];

    const leaseIds = property.leases.map((lease) => lease.id);
    const invoices = leaseIds.length > 0
      ? await this.prisma.invoice.findMany({
          where: { leaseId: { in: leaseIds } },
          select: { id: true },
        })
      : [];
    const invoiceIds = invoices.map((invoice) => invoice.id);

    await this.prisma.$transaction(async (tx) => {
      // Se eliminan primero las dependencias financieras para respetar las llaves foráneas.
      // Las notificaciones bancarias se conservan como auditoría y sus relaciones pasan a null.
      if (invoiceIds.length > 0) {
        await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
      }
      if (leaseIds.length > 0) {
        await tx.lease.deleteMany({ where: { id: { in: leaseIds } } });
      }
      await tx.property.delete({ where: { id: propertyId } });
    });

    await this.files.removeStoredFiles(storedFiles);
    return {
      deleted: true,
      id: propertyId,
      deletedLeases: leaseIds.length,
      deletedInvoices: invoiceIds.length,
    };
  }

  private async ensureExists(id: string): Promise<void> {
    if (!(await this.prisma.property.findUnique({ where: { id } }))) {
      throw new NotFoundException('Inmueble no encontrado.');
    }
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let slug = base;
    let suffix = 1;
    while (await this.prisma.property.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  private optionalText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}
