'use client';

import { useActionState } from 'react';
import { createInvoiceAction, type ActionState } from '@/app/actions';
import type { Lease } from '@/lib/types';

export function AdminInvoiceForm({ leases }: { leases: Lease[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createInvoiceAction, {});
  return (
    <form className="form card adminForm" action={action}>
      <h2>Generar factura</h2>
      <label>Contrato<select name="leaseId" required><option value="">Seleccione</option>{leases.map((lease) => <option value={lease.id} key={lease.id}>{lease.user.name} — {lease.property.title}</option>)}</select></label>
      <div className="threeCols"><label>Periodo<input type="date" name="period" required /></label><label>Vencimiento<input type="date" name="dueDate" required /></label><label>Valor COP<input type="number" name="amount" min="1" required /></label></div>
      {state.error && <p className="alert error">{state.error}</p>}
      {state.success && <p className="alert success">{state.success}</p>}
      <button className="button" disabled={pending}>{pending ? 'Generando…' : 'Crear factura'}</button>
    </form>
  );
}
