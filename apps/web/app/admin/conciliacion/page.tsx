import type { Metadata } from 'next';
import { AdminNav } from '@/components/AdminNav';
import { apiFetch } from '@/lib/api';
import { fecha, pesos } from '@/lib/format';
import { requireUser } from '@/lib/auth';
import type { BankPaymentNotification, ImportBatch, ReceivingBankAccount } from '@/lib/types';

export const metadata: Metadata = { title: 'Conciliación de pagos' };
export const dynamic = 'force-dynamic';

export default async function ReconciliationPage() {
  await requireUser('ADMIN');
  const [notifications, accounts, imports] = await Promise.all([
    apiFetch<BankPaymentNotification[]>('/admin/reconciliation/notifications', {}, true),
    apiFetch<ReceivingBankAccount[]>('/admin/reconciliation/accounts', {}, true),
    apiFetch<ImportBatch[]>('/admin/reconciliation/imports', {}, true),
  ]);

  return (
    <section className="section pageTop"><div className="container adminLayout"><AdminNav /><div className="adminContent">
      <div className="pageHeading compact"><span className="eyebrow">Automatización n8n</span><h1>Conciliación Bancolombia</h1><p>Consulta cuentas receptoras, cargas históricas de datos y notificaciones procesadas.</p></div>

      <div className="card tableCard"><div className="tableTitle"><h2>Cuentas receptoras</h2><span>{accounts.length} configuradas</span></div>
        <div className="responsiveTable"><table><thead><tr><th>Banco</th><th>Cuenta</th><th>Contratos</th><th>Notificaciones</th><th>Estado</th></tr></thead><tbody>
          {accounts.map((account) => <tr key={account.id}><td>{account.bank}</td><td>****{account.accountLast4}</td><td>{account._count.leaseLinks}</td><td>{account._count.notifications}</td><td><span className={`status ${account.active ? 'paid' : 'void'}`}>{account.active ? 'ACTIVA' : 'INACTIVA'}</span></td></tr>)}
          {accounts.length === 0 && <tr><td colSpan={5}>No hay cuentas configuradas. Ejecute el importador con BANCOLOMBIA_ACCOUNT_LAST4.</td></tr>}
        </tbody></table></div>
      </div>

      <div className="card tableCard"><div className="tableTitle"><h2>Cargas históricas</h2><span>{imports.length} lotes</span></div>
        <div className="responsiveTable"><table><thead><tr><th>Archivo</th><th>Inicio</th><th>Importados</th><th>Revisión</th><th>Estado</th></tr></thead><tbody>
          {imports.map((batch) => <tr key={batch.id}><td>{batch.sourceFile}</td><td>{fecha(batch.startedAt)}</td><td>{batch.importedRows}/{batch.totalRows}</td><td>{batch.reviewRows}</td><td><span className={`status ${batch.status === 'COMPLETED' ? 'paid' : batch.status === 'FAILED' ? 'overdue' : 'pending'}`}>{batch.status}</span></td></tr>)}
          {imports.length === 0 && <tr><td colSpan={5}>Todavía no se ha ejecutado el importador de arrendamientos.</td></tr>}
        </tbody></table></div>
      </div>

      <div className="card tableCard"><div className="tableTitle"><h2>Notificaciones bancarias</h2><span>{notifications.length} registros recientes</span></div>
        <div className="responsiveTable"><table><thead><tr><th>Fecha</th><th>Pagador</th><th>Valor</th><th>Cuenta</th><th>Factura</th><th>Estado</th><th>Motivo</th></tr></thead><tbody>
          {notifications.map((notification) => <tr key={notification.id}><td>{fecha(notification.receivedAt)}</td><td>{notification.payerName ?? 'Sin identificar'}</td><td>{notification.amount ? pesos(notification.amount) : '—'}</td><td>{notification.accountLast4 ? `****${notification.accountLast4}` : '—'}</td><td>{notification.matchedInvoice?.code ?? '—'}</td><td><span className={`status ${notification.status === 'MATCHED' ? 'paid' : notification.status === 'REJECTED' || notification.status === 'ERROR' ? 'overdue' : 'pending'}`}>{notification.status}</span></td><td>{notification.reviewReason ?? notification.payment?.reference ?? 'Procesada'}</td></tr>)}
          {notifications.length === 0 && <tr><td colSpan={7}>No se han recibido notificaciones bancarias.</td></tr>}
        </tbody></table></div>
      </div>
    </div></div></section>
  );
}
