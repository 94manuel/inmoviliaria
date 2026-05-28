import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateNewsPostDto } from './dto/create-news-post.dto.js';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublished() {
    return this.prisma.newsPost.findMany({
      where: { published: true },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  featured() {
    return this.prisma.newsPost.findMany({
      where: { published: true },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  }

  async findBySlug(slug: string) {
    const newsPost = await this.prisma.newsPost.findFirst({
      where: { slug, published: true },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    if (!newsPost) throw new NotFoundException('Noticia no encontrada.');
    return newsPost;
  }

  listAdmin() {
    return this.prisma.newsPost.findMany({
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateNewsPostDto, administratorId: string) {
    return this.prisma.newsPost.create({
      data: {
        title: dto.title.trim(),
        slug: await this.uniqueSlug(dto.title),
        summary: dto.summary.trim(),
        content: dto.content.trim(),
        sourceLabel: this.optionalText(dto.sourceLabel),
        externalUrl: this.optionalText(dto.externalUrl),
        published: dto.published ?? true,
        createdById: administratorId,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async archive(newsPostId: string) {
    await this.ensureExists(newsPostId);
    return this.prisma.newsPost.update({
      where: { id: newsPostId },
      data: { published: false },
    });
  }

  private async ensureExists(id: string): Promise<void> {
    if (!(await this.prisma.newsPost.findUnique({ where: { id } }))) {
      throw new NotFoundException('Noticia no encontrada.');
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
    while (await this.prisma.newsPost.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  private optionalText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}