import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminNav } from '@/components/AdminNav';
import { AdminUserForm } from '@/components/AdminUserForm';
import { apiFetch } from '@/lib/api';
import { pesos } from '@/lib/format';
import { requireUser } from '@/lib/auth';
import type { AdminUserSummary, UserFinancialState } from '@/lib/types';

export const metadata: Metadata = { title: 'Administrar usuarios' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string }>;
}) {
  await requireUser('ADMIN');
  const { buscar = '' } = await searchParams;
  const query = buscar.trim() ? `?search=${encodeURIComponent(buscar.trim())}` : '';
  const users = await apiFetch<AdminUserSummary[]>(`/admin/users${query}`, {}, true);

  return (
    <section className="section pageTop">
      <div className="container adminLayout">
        <AdminNav />
        <div className="adminContent">
          <div className="pageHeading compact">
            <span className="eyebrow">Administración</span>
            <h1>Usuarios</h1>
            <p>Consulta los perfiles de clientes, sus inmuebles, saldos y pagos. Los datos históricos y las cuentas creadas en la web se muestran en una sola vista.</p>
          </div>

          <AdminUserForm />

          <form className="card adminSearch" method="get">
            <label>
              Buscar usuario
              <input name="buscar" defaultValue={buscar} placeholder="Nombre, correo, documento o teléfono" />
            </label>
            <button className="button small" type="submit">Buscar</button>
            {buscar && <Link className="button ghost small" href="/admin/usuarios">Limpiar</Link>}
          </form>

          <div className="card tableCard">
            <div className="tableTitle"><h2>Directorio de usuarios</h2><span>{users.length} registros</span></div>
            <div className="responsiveTable">
              <table>
                <thead><tr><th>Usuario</th><th>Contacto</th><th>Acceso web</th><th>Inmueble actual</th><th>Estado de pago</th><th>Saldo</th><th /></tr></thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.name}</strong><br /><span className="muted">{user.documentNumber || 'Sin documento'}</span></td>
                      <td>{user.email || 'Sin correo'}<br /><span className="muted">{user.phone || 'Sin teléfono'}</span></td>
                      <td>{user.webAccount ? <span className="status paid">Registrado</span> : <span className="status archived">Sin acceso</span>}</td>
                      <td>{user.activeLease?.property.title ?? <span className="muted">Sin inmueble</span>}</td>
                      <td><span className={`status ${financialClass(user.financial.state)}`}>{financialLabel(user.financial.state)}</span></td>
                      <td>{pesos(user.financial.outstandingAmount)}</td>
                      <td><Link className="textLink" href={`/admin/usuarios/${user.id}`}>Ver detalle →</Link></td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={7} className="muted">No se encontraron usuarios.</td></tr>}
                </tbody>
              </table>
            </div>
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
