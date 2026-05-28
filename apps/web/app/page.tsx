import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { NewsPost, Property } from '@/lib/types';
import { NewsCard } from '@/components/NewsCard';
import { PropertyCard } from '@/components/PropertyCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, featuredNews] = await Promise.all([
    apiFetch<Property[]>('/properties/featured'),
    apiFetch<NewsPost[]>('/news/featured'),
  ]);
  return (
    <>
      <section className="hero">
        <div className="container heroGrid">
          <div className="heroCopy">
            <span className="eyebrow">Arriendos en Bogotá</span>
            <h1>Encuentra el espacio donde comienza tu próxima historia.</h1>
            <p>Inmuebles verificados, procesos transparentes y pagos en línea para arrendatarios.</p>
            <div className="heroButtons"><Link className="button" href="/inmuebles">Ver inmuebles</Link><Link className="button outline" href="/contacto">Hablar con un asesor</Link></div>
            <div className="trust"><div><strong>+120</strong><span>inmuebles administrados</span></div><div><strong>Digital</strong><span>facturas y pagos</span></div><div><strong>24/7</strong><span>consulta de cuenta</span></div></div>
          </div>
          <div className="heroVisual">
            <div className="heroHome">
              <div className="roof" /><div className="house"><div className="window"/><div className="door"/></div>
            </div>
            <div className="floatingCard"><strong>Pago seguro</strong><span>Consulta facturas pendientes y pagadas</span></div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="sectionHeading"><div><span className="eyebrow">Destacados</span><h2>Inmuebles disponibles</h2></div><Link className="textLink" href="/inmuebles">Ver todos →</Link></div>
          <div className="cardsGrid">{featured.map((property) => <PropertyCard property={property} key={property.id} />)}</div>
        </div>
      </section>
      <section className="sectionAlt">
        <div className="container">
          <div className="sectionHeading"><div><span className="eyebrow">Noticias</span><h2>Novedades y prensa del sector</h2></div><Link className="textLink" href="/noticias">Ver noticias →</Link></div>
          {featuredNews.length > 0 ? (
            <div className="cardsGrid newsGrid">{featuredNews.map((newsPost) => <NewsCard newsPost={newsPost} key={newsPost.id} />)}</div>
          ) : (
            <div className="card empty">Pronto publicaremos novedades inmobiliarias y enlaces a medios digitales relevantes.</div>
          )}
        </div>
      </section>
      <section className="benefits sectionAlt">
        <div className="container benefitsGrid">
          <div><span className="eyebrow">Por qué elegirnos</span><h2>Una experiencia inmobiliaria simple y confiable</h2></div>
          <article><strong>01</strong><h3>Publicaciones verificadas</h3><p>Información clara del canon, administración, ubicación y características.</p></article>
          <article><strong>02</strong><h3>Cuenta digital</h3><p>Consulta tus facturas mensuales y el historial de pagos desde cualquier dispositivo.</p></article>
          <article><strong>03</strong><h3>Pagos protegidos</h3><p>Flujo preparado para pasarela de pagos y confirmación mediante webhook seguro.</p></article>
        </div>
      </section>
    </>
  );
}
