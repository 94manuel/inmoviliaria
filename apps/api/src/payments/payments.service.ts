import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';

interface WompiEvent {
  event?: string;
  data?: { transaction?: Record<string, unknown> } & Record<string, unknown>;
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly invoices: InvoicesService) {}

  async createIntent(invoiceId: string, userId: string) {
    const invoice = await this.invoices.findMine(invoiceId, userId);
    if (invoice.status === 'PAID' || invoice.status === 'VOID' || invoice.balance <= 0) {
      throw new BadRequestException('Esta factura no tiene saldo pendiente para pagar.');
    }
    const reference = `INV-${invoice.code}-${randomUUID().slice(0, 8)}`;
    const paymentProvider = (process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase();
    const provider = paymentProvider === 'wompi'
      ? 'WOMPI'
      : paymentProvider === 'cybervestigio'
        ? 'CYBERVESTIGIO'
        : paymentProvider === 'mock'
          ? 'MOCK'
          : null;
    if (!provider) throw new BadRequestException('PAYMENT_PROVIDER no es válido. Use mock, wompi o cybervestigio.');
    let checkoutUrl: string | null = null;

    if (provider === 'WOMPI') {
      checkoutUrl = this.buildWompiCheckout(reference, invoice.balance);
    }
    if (provider === 'CYBERVESTIGIO') {
      checkoutUrl = this.buildCybervestigioCheckout(reference, invoice.balance, invoice.code);
    }
    const payment = await this.prisma.payment.create({
      data: { reference, amount: invoice.balance, invoiceId, userId, tenantId: invoice.tenantId, provider, status: 'PENDING', checkoutUrl },
    });
    return { payment, provider, checkoutUrl };
  }

  async approveMock(reference: string, userId: string) {
    if ((process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase() !== 'mock') {
      throw new ForbiddenException('La aprobación simulada solo está habilitada en modo mock.');
    }
    const payment = await this.prisma.payment.findFirst({ where: { reference, userId, provider: 'MOCK' } });
    if (!payment) throw new NotFoundException('Pago no encontrado.');
    return this.prisma.$transaction(async (tx) => {
      const approved = await tx.payment.update({ where: { id: payment.id }, data: { status: 'APPROVED' } });
      await tx.invoice.update({ where: { id: payment.invoiceId }, data: { status: 'PAID', paidAt: new Date() } });
      return approved;
    });
  }

  async processWompiEvent(event: WompiEvent, headerChecksum?: string) {
    const secret = process.env.WOMPI_EVENTS_SECRET;
    if (!secret) throw new BadRequestException('WOMPI_EVENTS_SECRET no está configurado.');
    const checksum = headerChecksum ?? event.signature?.checksum;
    const properties = event.signature?.properties ?? [];
    if (!checksum || !event.data || !event.timestamp || properties.length === 0) {
      throw new BadRequestException('Evento Wompi incompleto.');
    }
    const values = properties.map((property) => String(this.readPath(event.data!, property) ?? '')).join('');
    const calculated = createHash('sha256').update(`${values}${event.timestamp}${secret}`).digest('hex');
    const received = checksum.toLowerCase();
    if (calculated.length !== received.length || !timingSafeEqual(Buffer.from(calculated), Buffer.from(received))) {
      throw new BadRequestException('Firma de evento Wompi inválida.');
    }
    if (event.event !== 'transaction.updated') return { received: true, ignored: true };
    const transaction = event.data.transaction ?? {};
    const reference = String(transaction.reference ?? '');
    const externalStatus = String(transaction.status ?? 'ERROR').toUpperCase();
    const payment = await this.prisma.payment.findUnique({ where: { reference } });
    if (!payment) return { received: true, ignored: true };
    const status = ['APPROVED', 'DECLINED', 'ERROR', 'VOIDED'].includes(externalStatus)
      ? (externalStatus as 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED')
      : 'PENDING';
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status, externalId: String(transaction.id ?? '') || null },
      });
      if (status === 'APPROVED') {
        await tx.invoice.update({ where: { id: payment.invoiceId }, data: { status: 'PAID', paidAt: new Date() } });
      }
    });
    return { received: true };
  }

  private buildWompiCheckout(reference: string, amountInPesos: number): string {
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    const redirectUrl = process.env.WOMPI_REDIRECT_URL ?? 'http://localhost:3000/mi-cuenta';
    if (!publicKey || !integritySecret) throw new BadRequestException('Configure las llaves de Wompi.');
    const amountInCents = amountInPesos * 100;
    const signature = createHash('sha256').update(`${reference}${amountInCents}COP${integritySecret}`).digest('hex');
    const params = new URLSearchParams({
      'public-key': publicKey,
      currency: 'COP',
      'amount-in-cents': String(amountInCents),
      reference,
      'signature:integrity': signature,
      'redirect-url': redirectUrl,
    });
    return `https://checkout.wompi.co/p/?${params.toString()}`;
  }

  private buildCybervestigioCheckout(reference: string, amountInPesos: number, invoiceCode: string): string {
    const baseUrl = process.env.CYBERVESTIGIO_CHECKOUT_URL ?? 'https://cybervestigio.com/pagos';
    const returnUrl = process.env.CYBERVESTIGIO_RETURN_URL ?? process.env.WEB_ORIGIN ?? 'http://localhost:3000/mi-cuenta';
    const checkoutUrl = new URL(baseUrl);
    checkoutUrl.searchParams.set('reference', reference);
    checkoutUrl.searchParams.set('amount', String(amountInPesos));
    checkoutUrl.searchParams.set('currency', 'COP');
    checkoutUrl.searchParams.set('description', `Pago factura ${invoiceCode}`);
    checkoutUrl.searchParams.set('returnUrl', returnUrl);
    return checkoutUrl.toString();
  }

  private readPath(source: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((value, key) => {
      if (typeof value !== 'object' || value === null) return undefined;
      return (value as Record<string, unknown>)[key];
    }, source);
  }
}
