import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateInvoiceDto } from './dto/create-invoice.dto.js';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: {
        lease: { include: { property: { select: { title: true, address: true } } } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async findMine(invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { lease: { include: { property: true } }, payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada.');
    return invoice;
  }

  listAdmin() {
    return this.prisma.invoice.findMany({
      include: { user: { select: { name: true, email: true } }, lease: { include: { property: { select: { title: true } } } } },
      orderBy: { dueDate: 'desc' },
    });
  }

  async create(dto: CreateInvoiceDto) {
    const lease = await this.prisma.lease.findUnique({ where: { id: dto.leaseId } });
    if (!lease) throw new NotFoundException('Contrato no encontrado.');
    return this.prisma.invoice.create({
      data: {
        code: `FAC-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        leaseId: lease.id,
        userId: lease.userId,
        period: new Date(dto.period),
        dueDate: new Date(dto.dueDate),
        amount: dto.amount,
      },
    });
  }
}
