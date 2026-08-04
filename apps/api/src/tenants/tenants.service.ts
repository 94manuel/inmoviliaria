import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  listAdmin(search?: string) {
    const term = search?.trim();
    return this.prisma.tenant.findMany({
      where: term
        ? {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
              { documentNumber: { contains: term, mode: 'insensitive' } },
              { phone: { contains: term, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        sourceKey: true,
        name: true,
        email: true,
        phone: true,
        documentNumber: true,
        userId: true,
        leases: {
          where: { active: true },
          select: {
            id: true,
            property: { select: { id: true, title: true, address: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
