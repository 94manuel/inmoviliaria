import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics() {
    const [availableProperties, pendingInvoices, newContacts, paid] = await Promise.all([
      this.prisma.property.count({ where: { status: 'AVAILABLE', published: true } }),
      this.prisma.invoice.count({ where: { status: { in: ['PENDING', 'OVERDUE'] }, deletedAt: null } }),
      this.prisma.contactMessage.count({ where: { status: 'NEW' } }),
      this.prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: 'PAID', deletedAt: null } }),
    ]);
    return {
      availableProperties,
      pendingInvoices,
      newContacts,
      collectedAmount: paid._sum.amount ?? 0,
    };
  }
}
