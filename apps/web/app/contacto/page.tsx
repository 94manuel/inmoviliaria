import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = { title: 'Contacto' };

export default function ContactPage() {
  return (
    <section className="section pageTop">
      <div className="container contactGrid">
        <div className="pageHeading"><span className="eyebrow">Contacto</span><h1>Hablemos de tu próximo arriendo</h1><p>Un asesor responderá tu solicitud y te ayudará a coordinar visitas.</p><div className="contactInfo"><p><strong>Teléfono</strong><br />+57 601 555 0185</p><p><strong>Correo</strong><br />contacto@asesoriainmobiliariajb.com</p><p><strong>Horario</strong><br />Lunes a viernes · 8:00 a. m. – 6:00 p. m.</p></div></div>
        <div className="card formPanel"><ContactForm /></div>
      </div>
    </section>
  );
}
