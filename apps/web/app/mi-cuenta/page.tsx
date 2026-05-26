import Link from 'next/link';
import type { Metadata } from 'next';
import { apiFetch, fecha, pesos } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import type { Invoice } from '@/lib/types';

export const metadata: Metadata = { title: 'Mi cuenta' };
export const dynamic = 'force-dynamic';

export default async function MyAccountPage({ searchParams }: { searchParams: Promise<{ pago?: string }> }) {
  const user = await requireUser('USER');
  const invoices = await apiFetch<Invoice[]>('/invoices/me', {}, true);
  const query = await searchParams;
  const pending = invoices.filter((invoice) => invoice.status !== 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = invoices.filter((invoice) => invoice.status === 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0);
  return (
    <section className="section pageTop accountPage">
      <div className="container">
        {query.pago === 'aprobado' && <p className="alert success">Tu pago fue aprobado y la factura ya se encuentra actualizada.</p>}
        <div className="pageHeading"><span className="eyebrow">Mi cuenta</span><h1>Bienvenido, {user.name}</h1><p>Consulta facturas y el estado de tus pagos de arriendo.</p></div>
        <div className="metricGrid userMetrics">
          <div className="metric"><span>Saldo pendiente</span><strong>{pesos(pending)}</strong></div>
          <div className="metric"><span>Total pagado</span><strong>{pesos(paid)}</strong></div>
          <div className="metric"><span>Facturas registradas</span><strong>{invoices.length}</strong></div>
        </div>
        <div className="card tableCard">
          <div className="tableTitle"><h2>Mis facturas</h2></div>
          <div className="responsiveTable">
            <table><thead><tr><th>Factura</th><th>Inmueble</th><th>Periodo</th><th>Vence</th><th>Valor</th><th>Estado</th><th /></tr></thead>
              <tbody>{invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.code}</td><td>{invoice.lease.property.title}</td><td>{fecha(invoice.period)}</td><td>{fecha(invoice.dueDate)}</td><td>{pesos(invoice.amount)}</td>
                  <td><span className={`status ${invoice.status.toLowerCase()}`}>{invoice.status === 'PAID' ? 'Pagada' : 'Pendiente'}</span></td>
                  <td>{invoice.status !== 'PAID' ? <Link className="button small" href={`/mi-cuenta/facturas/${invoice.id}/pagar`}>Pagar</Link> : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {invoices.length === 0 && <div className="empty">No tienes facturas registradas.</div>}
        </div>
      </div>
    </section>
  );
}
