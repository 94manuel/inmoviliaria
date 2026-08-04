import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AdminNav } from '@/components/AdminNav';
import { AdminAssignPropertyForm } from '@/components/AdminAssignPropertyForm';
import { apiFetch } from '@/lib/api';
import { assetUrl, fecha, pesos } from '@/lib/format';
import { requireUser } from '@/lib/auth';
import type { AdminUserDetail, Property, UserFinancialState } from '@/lib/types';

export const metadata: Metadata = { title: 'Detalle del usuario' };
export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser('ADMIN');
  const { id } = await params;
  const [user, properties] = await Promise.all([
    apiFetch<AdminUserDetail>(`/admin/users/${id}`, {}, true),
    apiFetch<Property[]>('/admin/properties', {}, true),
  ]);
  const availableProperties = properties.filter((property) => property.status === 'AVAILABLE');

  return (
    <section className="section pageTop">
      <div className="container adminLayout">
        <AdminNav />
        <div className="adminContent">
          <div className="pageHeading compact">
            <span className="eyebrow">Administración · Usuarios</span>
            <h1>{user.name}</h1>
            <p>Información personal, inmuebles asignados, obligaciones y trazabilidad de pagos.</p>
            <Link className="textLink" href="/admin/usuarios">← Volver al directorio</Link>
          </div>

          <div className="metricGrid userMetrics">
            <div className="metric"><span>Estado de cartera</span><strong>{financialLabel(user.financial.state)}</strong><small>{user.financial.invoiceCount} facturas registradas</small></div>
            <div className="metric"><span>Saldo pendiente</span><strong>{pesos(user.financial.outstandingAmount)}</strong><small>pendiente y vencido</small></div>
            <div className="metric"><span>Pagos aprobados</span><strong>{pesos(user.financial.approvedPayments)}</strong><small>histórico confirmado</small></div>
          </div>

          <div className="userDetailGrid">
            <article className="card userProfileCard">
              <div className="tableTitle"><h2>Información del usuario</h2><span>{user.user ? 'Cuenta web vinculada' : 'Perfil administrativo'}</span></div>
              <dl className="dataList">
                <div><dt>Nombre</dt><dd>{user.name}</dd></div>
                <div><dt>Documento</dt><dd>{user.documentNumber || 'No registrado'}</dd></div>
                <div><dt>Correo</dt><dd>{user.email || 'No registrado'}</dd></div>
                <div><dt>Teléfono</dt><dd>{user.phone || 'No registrado'}</dd></div>
                <div><dt>Acceso web</dt><dd>{user.user ? `Sí · ${user.user.email}` : 'Todavía no tiene contraseña de acceso'}</dd></div>
                <div><dt>Rol de acceso</dt><dd>{user.user?.role ?? 'Sin cuenta web'}</dd></div>
                <div><dt>Nombres asociados</dt><dd>{user.aliases.length > 0 ? user.aliases.map((alias) => alias.alias).join(', ') : 'Sin nombres adicionales'}</dd></div>
                <div><dt>Creado</dt><dd>{fecha(user.createdAt)}</dd></div>
                <div><dt>Actualizado</dt><dd>{fecha(user.updatedAt)}</dd></div>
              </dl>
            </article>
            <article className="card userProfileCard">
              <div className="tableTitle"><h2>Resumen de pagos</h2><span className={`status ${financialClass(user.financial.state)}`}>{financialLabel(user.financial.state)}</span></div>
              <dl className="dataList">
                <div><dt>Pendiente</dt><dd>{pesos(user.financial.pendingAmount)}</dd></div>
                <div><dt>Vencido</dt><dd>{pesos(user.financial.overdueAmount)}</dd></div>
                <div><dt>Facturado como pagado</dt><dd>{pesos(user.financial.paidAmount)}</dd></div>
                <div><dt>Pagos aprobados</dt><dd>{pesos(user.financial.approvedPayments)}</dd></div>
              </dl>
            </article>
          </div>

          <AdminAssignPropertyForm userId={user.id} properties={availableProperties} />

          <div className="card tableCard">
            <div className="tableTitle"><h2>Inmuebles y contratos</h2><span>{user.leases.length} contratos</span></div>
            <div className="responsiveTable"><table>
              <thead><tr><th>Inmueble</th><th>Dirección</th><th>Contrato</th><th>Valor mensual</th><th>Novedades</th><th>Estado</th></tr></thead>
              <tbody>{user.leases.map((lease) => (
                <tr key={lease.id}>
                  <td className="propertyRow"><div className="thumb"><Image src={assetUrl(lease.property.images[0]?.url)} alt={lease.property.title} fill sizes="54px" /></div>{lease.property.title}</td>
                  <td>{lease.property.address}<br /><span className="muted">{lease.property.neighborhood}, {lease.property.city}</span></td>
                  <td>{lease.startDate ? fecha(lease.startDate) : 'Sin fecha'}{lease.endDate ? ` – ${fecha(lease.endDate)}` : ''}</td>
                  <td>{pesos(lease.expectedMonthlyPayment ?? lease.property.monthlyRent)}</td>
                  <td>{lease.novelty || lease.observations || <span className="muted">Sin novedades</span>}</td>
                  <td><span className={`status ${lease.active ? 'paid' : 'archived'}`}>{lease.active ? 'Activo' : 'Finalizado'}</span></td>
                </tr>
              ))}{user.leases.length === 0 && <tr><td colSpan={6} className="muted">Este usuario todavía no tiene inmuebles asignados.</td></tr>}</tbody>
            </table></div>
          </div>

          <div className="card tableCard">
            <div className="tableTitle"><h2>Historial de facturación</h2><span>{user.invoices.length} facturas</span></div>
            <div className="responsiveTable"><table>
              <thead><tr><th>Código</th><th>Inmueble</th><th>Periodo</th><th>Vencimiento</th><th>Valor</th><th>Estado</th><th>Pagado</th></tr></thead>
              <tbody>{user.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.code}</td>
                  <td>{invoice.lease.property.title}</td>
                  <td>{fecha(invoice.period)}</td>
                  <td>{fecha(invoice.dueDate)}</td>
                  <td>{pesos(invoice.amount)}</td>
                  <td><span className={`status ${invoice.status.toLowerCase()}`}>{invoiceStatus(invoice.status)}</span></td>
                  <td>{invoice.paidAt ? fecha(invoice.paidAt) : '—'}</td>
                </tr>
              ))}{user.invoices.length === 0 && <tr><td colSpan={7} className="muted">No hay facturas para este usuario.</td></tr>}</tbody>
            </table></div>
          </div>

          <div className="card tableCard">
            <div className="tableTitle"><h2>Historial de pagos</h2><span>{user.payments.length} movimientos</span></div>
            <div className="responsiveTable"><table>
              <thead><tr><th>Fecha</th><th>Referencia</th><th>Inmueble</th><th>Proveedor</th><th>Valor</th><th>Estado</th></tr></thead>
              <tbody>{user.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{fecha(payment.createdAt)}</td>
                  <td>{payment.bankReference || payment.reference}</td>
                  <td>{payment.invoice?.lease.property.title || 'Sin inmueble'}</td>
                  <td>{payment.provider}</td>
                  <td>{pesos(payment.amount)}</td>
                  <td><span className={`status ${payment.status.toLowerCase()}`}>{payment.status}</span></td>
                </tr>
              ))}{user.payments.length === 0 && <tr><td colSpan={6} className="muted">Todavía no hay pagos registrados.</td></tr>}</tbody>
            </table></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function financialLabel(state: UserFinancialState): string {
  if (state === 'OVERDUE') return 'Vencido';
  if (state === 'PENDING') return 'Pendiente';
  if (state === 'PAID') return 'Al día';
  return 'Sin cobros';
}

function financialClass(state: UserFinancialState): string {
  if (state === 'OVERDUE') return 'overdue';
  if (state === 'PENDING') return 'pending';
  if (state === 'PAID') return 'paid';
  return 'archived';
}

function invoiceStatus(status: string): string {
  if (status === 'PENDING') return 'Pendiente';
  if (status === 'OVERDUE') return 'Vencida';
  if (status === 'PAID') return 'Pagada';
  if (status === 'VOID') return 'Anulada';
  return status;
}
