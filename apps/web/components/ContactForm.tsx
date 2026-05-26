'use client';

import { useActionState } from 'react';
import { contactAction, type ActionState } from '@/app/actions';

export function ContactForm({ propertyTitle }: { propertyTitle?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(contactAction, {});
  return (
    <form className="form contactForm" action={action}>
      <label>Nombre<input name="name" required /></label>
      <div className="twoCols"><label>Correo<input type="email" name="email" required /></label><label>Teléfono<input name="phone" /></label></div>
      <label>Asunto<input name="subject" defaultValue={propertyTitle ? `Información: ${propertyTitle}` : ''} required /></label>
      <label>Mensaje<textarea name="message" rows={5} required defaultValue={propertyTitle ? 'Me interesa este inmueble. Deseo recibir información y agendar una visita.' : ''} /></label>
      {state.error && <p className="alert error">{state.error}</p>}
      {state.success && <p className="alert success">{state.success}</p>}
      <button className="button" disabled={pending}>{pending ? 'Enviando…' : 'Enviar solicitud'}</button>
    </form>
  );
}
