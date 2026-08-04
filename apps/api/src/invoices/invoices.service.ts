import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateInvoiceDto, InvoiceLineItemInputDto } from './dto/create-invoice.dto.js';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  listCatalog() {
    return Promise.all([
      this.prisma.chargeCatalogItem.findMany({
        where: { active: true, type: 'SERVICE' },
        orderBy: { name: 'asc' },
      }),
      this.prisma.chargeCatalogItem.findMany({
        where: { active: true, type: 'PRODUCT' },
        orderBy: { name: 'asc' },
      }),
    ]).then(([services, products]) => ({ services, products }));
  }

  listMine(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: {
        lineItems: {
          include: { catalogItem: { select: { code: true, name: true, type: true } } },
          orderBy: { createdAt: 'asc' },
        },
        lease: { include: { property: { select: { title: true, address: true } } } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async findMine(invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: {
        lease: { include: { property: true } },
        payments: { orderBy: { createdAt: 'desc' } },
        lineItems: {
          include: { catalogItem: { select: { code: true, name: true, type: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada.');
    return invoice;
  }

  listAdmin() {
    return this.prisma.invoice.findMany({
      include: {
        user: { select: { name: true, email: true } },
        tenant: { select: { name: true, email: true } },
        lease: { include: { property: { select: { title: true } } } },
        lineItems: {
          include: { catalogItem: { select: { code: true, name: true, type: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async create(dto: CreateInvoiceDto) {
    const lease = await this.prisma.lease.findUnique({ where: { id: dto.leaseId } });
    if (!lease) throw new NotFoundException('Contrato no encontrado.');

    const serviceItems = await this.prepareLineItems(dto.services, 'SERVICE');
    const productItems = await this.prepareLineItems(dto.products ?? [], 'PRODUCT');
    const lineItems = [...serviceItems, ...productItems];

    if (lineItems.length === 0) {
      throw new BadRequestException('Debe agregar al menos un servicio o producto para cobrar.');
    }

    const amount = lineItems.reduce((sum, item) => sum + item.total, 0);

    return this.prisma.invoice.create({
      data: {
        code: `FAC-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        leaseId: lease.id,
        userId: lease.userId,
        tenantId: lease.tenantId,
        period: new Date(dto.period),
        dueDate: new Date(dto.dueDate),
        amount,
        lineItems: {
          create: lineItems.map((item) => ({
            catalogItemId: item.catalogItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        lineItems: {
          include: { catalogItem: { select: { code: true, name: true, type: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  private async prepareLineItems(items: InvoiceLineItemInputDto[], expectedType: 'SERVICE' | 'PRODUCT') {
    if (items.length === 0) return [];

    const duplicated = new Set<string>();
    const uniqueIds = new Set<string>();
    for (const item of items) {
      if (uniqueIds.has(item.itemId)) duplicated.add(item.itemId);
      uniqueIds.add(item.itemId);
    }
    if (duplicated.size > 0) {
      throw new BadRequestException('No se permiten cobros repetidos en la misma sección. Ajuste las cantidades.');
    }

    const catalog = await this.prisma.chargeCatalogItem.findMany({
      where: { id: { in: [...uniqueIds] }, active: true, type: expectedType },
    });
    const catalogById = new Map(catalog.map((item) => [item.id, item]));

    return items.map((item) => {
      const catalogItem = catalogById.get(item.itemId);
      if (!catalogItem) {
        throw new BadRequestException(`Uno o más cobros de tipo ${expectedType} no existen o están inactivos.`);
      }
      return {
        catalogItemId: catalogItem.id,
        quantity: item.quantity,
        unitPrice: catalogItem.unitPrice,
        total: catalogItem.unitPrice * item.quantity,
      };
    });
  }
}
