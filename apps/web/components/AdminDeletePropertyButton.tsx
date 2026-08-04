'use client';

import { useActionState } from 'react';
import { deletePropertyAction, type ActionState } from '@/app/actions';

export function AdminDeletePropertyButton({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(deletePropertyAction, {});

  return (
    <div>
      <form
        action={action}
        onSubmit={(event) => {
          const accepted = window.confirm(
            `¿Eliminar definitivamente “${title}”? También se eliminarán sus contratos, facturas y pagos asociados. Esta acción no se puede deshacer.`,
          );
          if (!accepted) event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button className="textButton danger" disabled={pending}>
          {pending ? 'Eliminando…' : 'Eliminar'}
        </button>
      </form>
      {state.error && <small className="alert error">{state.error}</small>}
      {state.success && <small className="alert success">{state.success}</small>}
    </div>
  );
}
