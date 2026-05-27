'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

export type ActionState = { error?: string; success?: string };

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const response = await apiFetch<{ accessToken: string; user: { role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: formData.get('email'), password: formData.get('password') }),
    });
    (await cookies()).set('inmo_token', response.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    redirect(response.user.role === 'ADMIN' ? '/admin' : '/mi-cuenta');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: messageOf(error) };
  }
}

export async function registerAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const response = await apiFetch<{ accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'), email: formData.get('email'), phone: formData.get('phone'), password: formData.get('password'),
      }),
    });
    (await cookies()).set('inmo_token', response.accessToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 86400 });
    redirect('/mi-cuenta');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: messageOf(error) };
  }
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete('inmo_token');
  redirect('/');
}

export async function contactAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await apiFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'), email: formData.get('email'), phone: formData.get('phone'), subject: formData.get('subject'), message: formData.get('message'),
      }),
    });
    return { success: 'Recibimos tu solicitud. Un asesor se comunicará contigo.' };
  } catch (error) {
    return { error: messageOf(error) };
  }
}

export async function createPropertyAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await apiFetch('/admin/properties', { method: 'POST', body: formData }, true);
    revalidatePath('/admin/inmuebles');
    revalidatePath('/inmuebles');
    return { success: 'El inmueble fue publicado correctamente.' };
  } catch (error) {
    return { error: messageOf(error) };
  }
}

export async function archivePropertyAction(formData: FormData): Promise<void> {
  await apiFetch(`/admin/properties/${String(formData.get('id'))}`, { method: 'DELETE' }, true);
  revalidatePath('/admin/inmuebles');
  revalidatePath('/inmuebles');
}

export async function createInvoiceAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const services = parseInvoiceItems(formData.get('services'));
    const products = parseInvoiceItems(formData.get('products'));
    await apiFetch('/admin/invoices', {
      method: 'POST',
      body: JSON.stringify({
        leaseId: formData.get('leaseId'),
        period: formData.get('period'),
        dueDate: formData.get('dueDate'),
        services,
        products,
      }),
    }, true);
    revalidatePath('/admin/facturas');
    return { success: 'Factura generada exitosamente.' };
  } catch (error) {
    return { error: messageOf(error) };
  }
}

export async function beginPaymentAction(formData: FormData): Promise<void> {
  const invoiceId = String(formData.get('invoiceId'));
  const intent = await apiFetch<{ provider: string; checkoutUrl: string | null; payment: { reference: string } }>(`/payments/invoices/${invoiceId}/intent`, { method: 'POST' }, true);
  if (intent.checkoutUrl) redirect(intent.checkoutUrl);
  redirect(`/mi-cuenta/facturas/${invoiceId}/pagar?reference=${encodeURIComponent(intent.payment.reference)}`);
}

export async function approveMockAction(formData: FormData): Promise<void> {
  const reference = String(formData.get('reference'));
  await apiFetch(`/payments/mock/${encodeURIComponent(reference)}/approve`, { method: 'POST' }, true);
  revalidatePath('/mi-cuenta');
  redirect('/mi-cuenta?pago=aprobado');
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'No fue posible procesar la solicitud.';
}

function isRedirectError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'digest' in error && String((error as { digest?: string }).digest).startsWith('NEXT_REDIRECT');
}

function parseInvoiceItems(raw: FormDataEntryValue | null): Array<{ itemId: string; quantity: number }> {
  if (typeof raw !== 'string' || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as Array<{ itemId?: unknown; quantity?: unknown }>;
    return parsed
      .filter((item) => typeof item.itemId === 'string' && item.itemId.length > 0)
      .map((item) => {
        const quantity = Number(item.quantity ?? 1);
        return {
          itemId: String(item.itemId),
          quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
        };
      });
  } catch {
    return [];
  }
}
