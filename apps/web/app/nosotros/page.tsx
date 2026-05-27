import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Quiénes somos' };

export default function AboutPage() {
  return (
    <>
      <section className="section pageTop aboutHero">
        <div className="container aboutGrid">
          <div className="pageHeading"><span className="eyebrow">Quiénes somos</span><h1>Confianza para arrendar y administrar tu inmueble</h1><p>Asesoría Inmobiliaria JB combina asesoría cercana con herramientas digitales para simplificar publicaciones, contratos, facturas y pagos.</p><Link href="/contacto" className="button">Hablar con un asesor</Link></div>
          <div className="card values"><article><strong>Transparencia</strong><p>Canon, administración y estado de facturas visibles para cada arrendatario.</p></article><article><strong>Acompañamiento</strong><p>Atención para propietarios y usuarios durante el proceso de arriendo.</p></article><article><strong>Gestión digital</strong><p>Portal seguro para administrar publicaciones y pagos.</p></article></div>
        </div>
      </section>
      <section className="sectionAlt"><div className="container purpose"><div><span className="eyebrow">Nuestro propósito</span><h2>Hacer que arrendar sea claro, ágil y seguro.</h2></div><p>Publicamos inmuebles con información completa y galerías verificables; además, ofrecemos una cuenta digital donde los arrendatarios pueden consultar obligaciones y gestionar sus pagos.</p></div></section>
    </>
  );
}
