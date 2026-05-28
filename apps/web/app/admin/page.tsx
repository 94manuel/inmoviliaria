import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminNav } from '@/components/AdminNav';
import { apiFetch } from '@/lib/api';
import { pesos } from '@/lib/format';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Administración' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireUser('ADMIN');
  const metrics = await apiFetch<{ availableProperties: number; pendingInvoices: number; newContacts: number; collectedAmount: number }>('/admin/dashboard', {}, true);
  return (
    <section className="section pageTop">
      <div className="container adminLayout">
        <AdminNav />
        <div className="adminContent">
          <div className="pageHeading compact"><span className="eyebrow">Administración</span><h1>Resumen operativo</h1><p>Control de publicaciones, cobros y solicitudes recibidas.</p></div>
          <div className="metricGrid">
            <div className="metric"><span>Disponibles</span><strong>{metrics.availableProperties}</strong><small>inmuebles publicados</small></div>
            <div className="metric"><span>Facturas pendientes</span><strong>{metrics.pendingInvoices}</strong><small>requieren seguimiento</small></div>
            <div className="metric"><span>Recaudo registrado</span><strong>{pesos(metrics.collectedAmount)}</strong><small>pagos aprobados</small></div>
            <div className="metric"><span>Contactos nuevos</span><strong>{metrics.newContacts}</strong><small>por atender</small></div>
          </div>
          <div className="quickGrid"><Link className="card quickCard" href="/admin/inmuebles"><strong>Publicar inmueble</strong><span>Agregar información y fotografías →</span></Link><Link className="card quickCard" href="/admin/noticias"><strong>Publicar noticia</strong><span>Compartir novedades o enlazar prensa digital →</span></Link><Link className="card quickCard" href="/admin/archivos"><strong>Compartir archivos</strong><span>Subir documentos e insumos públicos →</span></Link><Link className="card quickCard" href="/admin/facturas"><strong>Gestionar facturas</strong><span>Crear cobros mensuales →</span></Link></div>
        </div>
      </div>
    </section>
  );
}
