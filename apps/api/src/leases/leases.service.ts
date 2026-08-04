import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LeasesService {
  constructor(private readonly prisma: PrismaService) {}

  listAdmin() {
    return this.prisma.lease.findMany({
      where: { active: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, email: true } },
        property: { select: { title: true, monthlyRent: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
