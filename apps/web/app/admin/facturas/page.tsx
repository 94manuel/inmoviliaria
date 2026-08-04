import type { Metadata } from 'next';
import { AdminNav } from '@/components/AdminNav';
import { AdminInvoiceForm } from '@/components/AdminInvoiceForm';
import { AdminInvoiceManager } from '@/components/AdminInvoiceManager';
import { apiFetch } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import type { ChargeCatalogItem, Invoice, Lease } from '@/lib/types';

export const metadata: Metadata = { title: 'Administrar facturas' };
export const dynamic = 'force-dynamic';

export default async function AdminInvoicesPage() {
  await requireUser('ADMIN');
  const [invoices, leases, catalog] = await Promise.all([
    apiFetch<Invoice[]>('/admin/invoices', {}, true),
    apiFetch<Lease[]>('/admin/leases', {}, true),
    apiFetch<{ services: ChargeCatalogItem[]; products: ChargeCatalogItem[] }>('/admin/invoices/catalog', {}, true),
  ]);
  return (
    <section className="section pageTop"><div className="container adminLayout"><AdminNav /><div className="adminContent">
      <div className="pageHeading compact"><span className="eyebrow">Administración</span><h1>Facturación</h1><p>Genera, modifica o elimina facturas y controla el saldo y el estado de pago de cada usuario.</p></div>
      <AdminInvoiceForm leases={leases} services={catalog.services} products={catalog.products} />
      <div className="card tableCard"><div className="tableTitle"><h2>Facturas emitidas</h2><span>{invoices.length} activas</span></div><AdminInvoiceManager invoices={invoices} /></div>
    </div></div></section>
  );
}
