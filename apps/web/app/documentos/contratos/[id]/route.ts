import { cookies } from 'next/headers';
import { apiBaseUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const token = (await cookies()).get('inmo_token')?.value;
  if (!token) return new Response('No autorizado.', { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const download = url.searchParams.get('download');
  const target = `${apiBaseUrl()}/api/leases/${encodeURIComponent(id)}/contract${download ? `?download=${encodeURIComponent(download)}` : ''}`;
  const upstream = await fetch(target, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!upstream.ok || !upstream.body) {
    const message = await upstream.text().catch(() => 'No fue posible abrir el contrato.');
    return new Response(message || 'No fue posible abrir el contrato.', { status: upstream.status });
  }

  const headers = new Headers();
  for (const name of ['content-type', 'content-length', 'content-disposition']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(upstream.body, { status: 200, headers });
}
