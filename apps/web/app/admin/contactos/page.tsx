import type { Metadata } from 'next';
import { AdminNav } from '@/components/AdminNav';
import { apiFetch } from '@/lib/api';
import { fecha } from '@/lib/format';
import { requireUser } from '@/lib/auth';
import type { ContactMessage } from '@/lib/types';

export const metadata: Metadata = { title: 'Contactos recibidos' };
export const dynamic = 'force-dynamic';

export default async function AdminContactsPage() {
  await requireUser('ADMIN');
  const messages = await apiFetch<ContactMessage[]>('/admin/contacts', {}, true);
  return (
    <section className="section pageTop"><div className="container adminLayout"><AdminNav /><div className="adminContent">
      <div className="pageHeading compact"><span className="eyebrow">Administración</span><h1>Solicitudes de contacto</h1><p>Revisa los mensajes enviados desde el sitio.</p></div>
      <div className="messages">{messages.map((message) => <article className="card message" key={message.id}><div><span className="status pending">{message.status}</span><time>{fecha(message.createdAt)}</time></div><h2>{message.subject}</h2><p>{message.message}</p><footer>{message.name} · {message.email}{message.phone ? ` · ${message.phone}` : ''}</footer></article>)}</div>
      {messages.length === 0 && <div className="empty">No hay mensajes registrados.</div>}
    </div></div></section>
  );
}
