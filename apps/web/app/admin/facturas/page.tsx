import type { Metadata } from 'next';
import { AdminNav } from '@/components/AdminNav';
import { AdminInvoiceForm } from '@/components/AdminInvoiceForm';
import { apiFetch, fecha, pesos } from '@/lib/api';
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
      <div className="pageHeading compact"><span className="eyebrow">Administración</span><h1>Facturación</h1><p>Genera cuentas de cobro y consulta pagos.</p></div>
      <AdminInvoiceForm leases={leases} services={catalog.services} products={catalog.products} />
      <div className="card tableCard"><div className="tableTitle"><h2>Facturas emitidas</h2></div><div className="responsiveTable"><table><thead><tr><th>Código</th><th>Usuario</th><th>Inmueble</th><th>Vence</th><th>Valor</th><th>Estado</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td>{invoice.code}</td><td>{invoice.user?.name}</td><td>{invoice.lease.property.title}</td><td>{fecha(invoice.dueDate)}</td><td>{pesos(invoice.amount)}</td><td><span className={`status ${invoice.status.toLowerCase()}`}>{invoice.status}</span></td></tr>)}</tbody></table></div></div>
    </div></div></section>
  );
}
