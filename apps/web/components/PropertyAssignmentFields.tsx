'use client';

import type { TenantOption } from '@/lib/types';

export type PropertyAssignmentMode = 'UNCHANGED' | 'NONE' | 'EXISTING' | 'NEW';

export function PropertyAssignmentFields({
  tenants,
  mode,
  onModeChange,
  allowUnchanged = false,
  currentTenantName,
  defaultExpectedPayment,
  defaultStartDate,
  defaultEndDate,
}: {
  tenants: TenantOption[];
  mode: PropertyAssignmentMode;
  onModeChange: (mode: PropertyAssignmentMode) => void;
  allowUnchanged?: boolean;
  currentTenantName?: string | null;
  defaultExpectedPayment?: number | null;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
}) {
  return (
    <fieldset className="formSection">
      <legend>Asignación del inmueble</legend>
      <p className="hint">
        Puedes asignarlo a un usuario existente o crear uno nuevo. Al asignarlo, el inmueble cambia a estado arrendado y deja de aparecer como disponible.
      </p>
      {currentTenantName && <p className="assignmentCurrent"><strong>Asignación actual:</strong> {currentTenantName}</p>}
      <label>
        Acción
        <select
          name="assignmentMode"
          value={mode}
          onChange={(event) => onModeChange(event.target.value as PropertyAssignmentMode)}
        >
          {allowUnchanged && <option value="UNCHANGED">Conservar asignación actual</option>}
          <option value="NONE">Dejar sin asignar / disponible</option>
          <option value="EXISTING">Asignar a arrendatario existente</option>
          <option value="NEW">Crear usuario y asignar</option>
        </select>
      </label>

      {mode === 'EXISTING' && (
        <label>
          Usuario existente
          <select name="tenantId" required>
            <option value="">Seleccione una persona…</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
                {tenant.documentNumber ? ` · ${tenant.documentNumber}` : ''}
                {tenant.email ? ` · ${tenant.email}` : ''}
                {tenant.leases.length > 0 ? ` · ${tenant.leases[0].property.title}` : ''}
              </option>
            ))}
          </select>
          <span className="hint">La lista reúne los usuarios históricos y las cuentas registradas en la web.</span>
        </label>
      )}

      {mode === 'NEW' && (
        <div className="assignmentNewFields">
          <div className="twoCols">
            <label>Nombre completo<input name="tenantName" required minLength={3} /></label>
            <label>Documento<input name="tenantDocumentNumber" /></label>
          </div>
          <div className="twoCols">
            <label>Correo<input name="tenantEmail" type="email" /></label>
            <label>Teléfono<input name="tenantPhone" /></label>
          </div>
          <p className="hint">Si el correo, documento o nombre ya existe, se reutilizará ese usuario en lugar de duplicarlo.</p>
        </div>
      )}

      {(mode === 'EXISTING' || mode === 'NEW') && (
        <div className="threeCols">
          <label>
            Inicio del contrato
            <input name="leaseStartDate" type="date" defaultValue={dateInput(defaultStartDate)} />
          </label>
          <label>
            Fin del contrato
            <input name="leaseEndDate" type="date" defaultValue={dateInput(defaultEndDate)} />
          </label>
          <label>
            Valor mensual acordado
            <input
              name="expectedMonthlyPayment"
              type="number"
              min="0"
              defaultValue={defaultExpectedPayment ?? undefined}
              placeholder="Usa el canon si queda vacío"
            />
          </label>
        </div>
      )}
    </fieldset>
  );
}

function dateInput(value?: string | null): string | undefined {
  return value ? value.slice(0, 10) : undefined;
}
