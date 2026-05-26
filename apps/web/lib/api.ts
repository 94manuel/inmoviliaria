import { cookies } from 'next/headers';
import type { User } from './types';

const internalApi = () => process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export const publicApiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export const assetUrl = (path?: string) => path ? `${publicApiUrl()}${path}` : '/property-placeholder.svg';

export async function apiFetch<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (authenticated) {
    const token = (await cookies()).get('inmo_token')?.value;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${internalApi()}/api${path}`, { ...init, headers, cache: 'no-store' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'No fue posible procesar la solicitud.' }));
    const message = Array.isArray(error.message) ? error.message.join(', ') : error.message;
    throw new Error(message ?? 'No fue posible procesar la solicitud.');
  }
  return response.json() as Promise<T>;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiFetch<User>('/auth/me', {}, true);
  } catch {
    return null;
  }
}

export const pesos = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
export const fecha = (value: string) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value));
