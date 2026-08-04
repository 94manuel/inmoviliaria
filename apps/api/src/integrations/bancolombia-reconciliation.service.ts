import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BancolombiaNotificationDto } from './dto/bancolombia-notification.dto.js';
import type { LegacyReconcilePaymentDto, LegacyRegisterPaymentDto } from './dto/legacy-payment.dto.js';

type Candidate = { invoice: any; score: number };

type ReconciliationResult = {
  action: 'CONFIRMED' | 'REVIEW_REQUIRED' | 'DUPLICATE' | 'REJECTED';
  reason: string;
  paymentId?: string;
  notificationId?: string;
  reference?: string;
  tenant?: { id: string; name: string; email: string | null };
  property?: { id: string; address: string };
  invoice?: { id: string; code: string; amount: number };
};

@Injectable()
export class BancolombiaReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async reconcile(input: BancolombiaNotificationDto): Promise<ReconciliationResult> {
    if (!this.isAllowedSender(input.sender)) {
      return { action: 'REJECTED', reason: 'El remitente no está autorizado por la aplicación.' };
    }

    const duplicate = await this.prisma.bankPaymentNotification.findUnique({
      where: { outlookMessageId: input.outlookMessageId },
      include: {
        payment: true,
        matchedInvoice: true,
        matchedLease: { include: { tenant: true, property: true } },
      },
    });
    if (duplicate) return this.duplicateResult(duplicate);

    const account = await this.findAccount(input.accountLast4);
    if (!account?.active) {
      const notification = await this.prisma.bankPaymentNotification.create({
        data: this.notificationData(input, {
          status: 'REJECTED',
          reviewReason: 'La cuenta receptora no está registrada o está inactiva.',
        }) as any,
      });
      return {
        action: 'REJECTED',
        reason: 'La cuenta receptora no está autorizada.',
        notificationId: notification.id,
      };
    }

    const match = await this.findCandidate(account.id, input.amount, input.payerName);
    if (!match.winner) {
      const notification = await this.prisma.bankPaymentNotification.create({
        data: this.notificationData(input, {
          status: 'REVIEW_REQUIRED',
          reviewReason: match.reason,
          accountId: account.id,
        }) as any,
      });
      return {
        action: 'REVIEW_REQUIRED',
        reason: match.reason,
        notificationId: notification.id,
      };
    }

    const { invoice, score } = match.winner;
    if (!invoice.tenant) {
      return { action: 'REVIEW_REQUIRED', reason: 'La factura coincidente no tiene arrendatario asociado.' };
    }

    const paymentReference = `BCO:${input.bankReference || input.outlookMessageId}`;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const notification = await tx.bankPaymentNotification.create({
          data: this.notificationData(input, {
            status: 'RECEIVED',
            accountId: account.id,
            matchedLeaseId: invoice.leaseId,
            matchedInvoiceId: invoice.id,
          }) as any,
        });

        const payment = await tx.payment.create({
          data: {
            reference: paymentReference,
            amount: input.amount,
            currency: input.currency ?? 'COP',
            provider: 'BANCOLOMBIA_EMAIL',
            status: 'APPROVED',
            externalId: input.bankReference || input.outlookMessageId,
            payerName: input.payerName,
            payerNameNormalized: normalizePersonName(input.payerName),
            bankAccountLast4: input.accountLast4,
            bankReference: input.bankReference,
            invoiceId: invoice.id,
            tenantId: invoice.tenant.id,
            userId: invoice.userId,
          },
        });

        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: 'PAID', paidAt: new Date(input.receivedAt) },
        });
        await tx.bankPaymentNotification.update({
          where: { id: notification.id },
          data: { status: 'MATCHED', paymentId: payment.id },
        });

        return {
          action: 'CONFIRMED' as const,
          reason: `Coincidencia única con puntaje ${score}.`,
          notificationId: notification.id,
          paymentId: payment.id,
          reference: payment.reference,
          tenant: {
            id: invoice.tenant.id,
            name: invoice.tenant.name,
            email: invoice.tenant.email,
          },
          property: {
            id: invoice.lease.property.id,
            address: invoice.lease.property.address,
          },
          invoice: { id: invoice.id, code: invoice.code, amount: invoice.amount },
        };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return {
          action: 'DUPLICATE',
          reason: 'La referencia bancaria o el correo ya habían sido procesados.',
          reference: paymentReference,
        };
      }
      throw error;
    }
  }

  async previewLegacy(input: LegacyReconcilePaymentDto) {
    const account = await this.findAccount(input.ultimos4Cuenta);
    if (!account?.active) {
      return { coincide: false, motivo: 'La cuenta receptora no está autorizada.' };
    }
    const match = await this.findCandidate(account.id, input.valor, input.pagador);
    if (!match.winner?.invoice.tenant) {
      return { coincide: false, motivo: match.reason };
    }
    const invoice = match.winner.invoice;
    return {
      coincide: true,
      motivo: `Coincidencia única con puntaje ${match.winner.score}.`,
      arrendatario: {
        id: invoice.tenant.id,
        nombre: invoice.tenant.name,
        email: invoice.tenant.email,
        contratoId: invoice.lease.id,
        contrato: invoice.lease.legacyCode ?? invoice.lease.id,
        inmueble: invoice.lease.property.address,
        valorEsperado: invoice.amount,
      },
    };
  }

  async registerLegacy(input: LegacyRegisterPaymentDto) {
    const reference = `BCO:${input.referenciaIdempotencia}`;
    const existing = await this.prisma.payment.findUnique({ where: { reference } });
    if (existing) return { duplicado: true, pagoId: existing.id };

    const duplicateNotification = await this.prisma.bankPaymentNotification.findUnique({
      where: { outlookMessageId: input.idCorreoOutlook },
      include: { payment: true },
    });
    if (duplicateNotification) {
      return { duplicado: true, pagoId: duplicateNotification.payment?.id ?? null };
    }

    const account = await this.findAccount(input.ultimos4Cuenta);
    if (!account?.active) return { registrado: false, motivo: 'La cuenta receptora no está autorizada.' };

    const lease = await this.prisma.lease.findFirst({
      where: {
        id: input.contratoId,
        tenantId: input.arrendatarioId,
        active: true,
        receivingAccounts: { some: { accountId: account.id, active: true } },
      },
      include: { tenant: true, property: true },
    });
    if (!lease?.tenant) return { registrado: false, motivo: 'El contrato o arrendatario no son válidos.' };

    const tolerance = this.amountTolerance();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        leaseId: lease.id,
        tenantId: lease.tenant.id,
        status: { in: ['PENDING', 'OVERDUE'] },
        deletedAt: null,
        amount: { gte: input.valor - tolerance, lte: input.valor + tolerance },
      },
      orderBy: { dueDate: 'asc' },
      take: 2,
    });
    if (invoices.length !== 1) {
      return {
        registrado: false,
        motivo: invoices.length === 0
          ? 'No existe una factura pendiente con ese valor.'
          : 'Existe más de una factura posible; se requiere revisión manual.',
      };
    }

    const invoice = invoices[0];
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const notification = await tx.bankPaymentNotification.create({
          data: {
            outlookMessageId: input.idCorreoOutlook,
            sender: 'n8n-legacy',
            subject: 'Conciliación Bancolombia desde workflow compatible',
            payerName: input.pagador,
            payerNameNormalized: normalizePersonName(input.pagador),
            amount: input.valor,
            currency: input.moneda ?? 'COP',
            accountLast4: input.ultimos4Cuenta,
            bankReference: input.referenciaBancaria,
            receivedAt: new Date(input.fechaPago),
            status: 'RECEIVED',
            accountId: account.id,
            matchedLeaseId: lease.id,
            matchedInvoiceId: invoice.id,
            rawPayload: { origen: input.origen ?? 'OUTLOOK_BANCOLOMBIA_N8N' },
          },
        });
        const payment = await tx.payment.create({
          data: {
            reference,
            amount: input.valor,
            currency: input.moneda ?? 'COP',
            provider: 'BANCOLOMBIA_EMAIL',
            status: 'APPROVED',
            externalId: input.referenciaBancaria || input.idCorreoOutlook,
            payerName: input.pagador,
            payerNameNormalized: normalizePersonName(input.pagador),
            bankAccountLast4: input.ultimos4Cuenta,
            bankReference: input.referenciaBancaria,
            invoiceId: invoice.id,
            tenantId: lease.tenant!.id,
            userId: invoice.userId,
          },
        });
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: 'PAID', paidAt: new Date(input.fechaPago) },
        });
        await tx.bankPaymentNotification.update({
          where: { id: notification.id },
          data: { status: 'MATCHED', paymentId: payment.id },
        });
        return payment;
      });
      return { registrado: true, pagoId: result.id };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const duplicate = await this.prisma.payment.findUnique({ where: { reference } });
        return { duplicado: true, pagoId: duplicate?.id ?? null };
      }
      throw error;
    }
  }

  listNotifications() {
    return this.prisma.bankPaymentNotification.findMany({
      include: {
        account: true,
        payment: true,
        matchedInvoice: true,
        matchedLease: { include: { tenant: true, property: true } },
      },
      orderBy: { receivedAt: 'desc' },
      take: 250,
    });
  }

  listAccounts() {
    return this.prisma.receivingBankAccount.findMany({
      include: { _count: { select: { leaseLinks: true, notifications: true } } },
      orderBy: [{ active: 'desc' }, { label: 'asc' }],
    });
  }

  listImportBatches() {
    return this.prisma.importBatch.findMany({
      include: { _count: { select: { records: true } } },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  private async findCandidate(accountId: string, amount: number, payerName: string): Promise<{ winner?: Candidate; reason: string }> {
    const tolerance = this.amountTolerance();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: { not: null },
        status: { in: ['PENDING', 'OVERDUE'] },
        deletedAt: null,
        amount: { gte: amount - tolerance, lte: amount + tolerance },
        lease: {
          active: true,
          receivingAccounts: { some: { active: true, accountId } },
        },
      },
      include: {
        tenant: { include: { aliases: true } },
        lease: { include: { property: true, payerAliases: true } },
      },
      take: 50,
    });

    const scored: Candidate[] = invoices
      .filter((invoice: any) => Boolean(invoice.tenant))
      .map((invoice: any) => ({
        invoice,
        score: nameScore(payerName, [
          invoice.tenant.name,
          ...invoice.tenant.aliases.map((alias: any) => alias.alias),
          ...invoice.lease.payerAliases.map((alias: any) => alias.alias),
        ]),
      }))
      .sort((a: Candidate, b: Candidate) => b.score - a.score);

    const winner = scored[0];
    const second = scored[1];
    const threshold = Number(process.env.PAYMENT_NAME_SCORE_MIN ?? '72');
    const uniqueMargin = Number(process.env.PAYMENT_NAME_SCORE_MARGIN ?? '12');
    if (!winner) return { reason: 'No existe una factura pendiente con el valor y cuenta informados.' };
    if (winner.score < threshold || (second && winner.score - second.score < uniqueMargin)) {
      return { reason: `La coincidencia del pagador no es única o confiable. Mejor puntaje: ${winner.score}.` };
    }
    return { winner, reason: `Coincidencia única con puntaje ${winner.score}.` };
  }

  private findAccount(accountLast4: string) {
    return this.prisma.receivingBankAccount.findUnique({
      where: { bank_accountLast4: { bank: 'Bancolombia', accountLast4 } },
    });
  }

  private isAllowedSender(sender: string): boolean {
    const allowed = (process.env.BANCOLOMBIA_ALLOWED_SENDERS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return allowed.length > 0 && allowed.includes(sender.trim().toLowerCase());
  }

  private amountTolerance(): number {
    const value = Number(process.env.PAYMENT_AMOUNT_TOLERANCE_COP ?? '0');
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  }

  private notificationData(input: BancolombiaNotificationDto, extra: Record<string, unknown>) {
    return {
      outlookMessageId: input.outlookMessageId,
      internetMessageId: input.internetMessageId,
      sender: input.sender,
      subject: input.subject,
      payerName: input.payerName,
      payerNameNormalized: normalizePersonName(input.payerName),
      amount: input.amount,
      currency: input.currency ?? 'COP',
      accountLast4: input.accountLast4,
      bankReference: input.bankReference,
      receivedAt: new Date(input.receivedAt),
      rawPayload: input.rawPayload as Prisma.InputJsonValue | undefined,
      ...extra,
    };
  }

  private duplicateResult(duplicate: any): ReconciliationResult {
    return {
      action: 'DUPLICATE',
      reason: 'La notificación de Outlook ya fue procesada.',
      notificationId: duplicate.id,
      paymentId: duplicate.payment?.id,
      reference: duplicate.payment?.reference,
      tenant: duplicate.matchedLease?.tenant
        ? {
            id: duplicate.matchedLease.tenant.id,
            name: duplicate.matchedLease.tenant.name,
            email: duplicate.matchedLease.tenant.email,
          }
        : undefined,
      property: duplicate.matchedLease
        ? { id: duplicate.matchedLease.property.id, address: duplicate.matchedLease.property.address }
        : undefined,
      invoice: duplicate.matchedInvoice
        ? { id: duplicate.matchedInvoice.id, code: duplicate.matchedInvoice.code, amount: duplicate.matchedInvoice.amount }
        : undefined,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}

export function normalizePersonName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameScore(payer: string, candidates: string[]): number {
  const normalizedPayer = normalizePersonName(payer);
  const payerTokens = new Set(normalizedPayer.split(' ').filter((token) => token.length > 2));
  let best = 0;
  for (const candidate of candidates) {
    const normalizedCandidate = normalizePersonName(candidate);
    if (!normalizedCandidate) continue;
    if (normalizedCandidate === normalizedPayer) {
      best = Math.max(best, 100);
      continue;
    }
    if (normalizedCandidate.includes(normalizedPayer) || normalizedPayer.includes(normalizedCandidate)) {
      best = Math.max(best, 90);
    }
    const candidateTokens = new Set(normalizedCandidate.split(' ').filter((token) => token.length > 2));
    const intersection = [...payerTokens].filter((token) => candidateTokens.has(token)).length;
    const union = new Set([...payerTokens, ...candidateTokens]).size;
    best = Math.max(best, Math.round((union ? intersection / union : 0) * 85));
  }
  return best;
}
