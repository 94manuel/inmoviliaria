import type { Metadata } from 'next';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { assetUrl, pesos } from '@/lib/format';
import type { Property } from '@/lib/types';
import { ContactForm } from '@/components/ContactForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await apiFetch<Property>(`/properties/${slug}`);
  return { title: property.title, description: property.description };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await apiFetch<Property>(`/properties/${slug}`);
  return (
    <section className="section pageTop">
      <div className="container">
        <div className="detailHeading"><div><span className="eyebrow">{property.neighborhood}, {property.city}</span><h1>{property.title}</h1><p>{property.address}</p></div><div className="detailPrice"><strong>{pesos(property.monthlyRent)}</strong><span>/ mes</span><small>Administración: {pesos(property.administrationFee)}</small></div></div>
        <div className="gallery">
          {(property.images.length ? property.images : [{ id: 'fallback', url: '', alt: property.title, sortOrder: 0 }]).map((image, index) => (
            <div className={index === 0 ? 'galleryMain' : 'gallerySmall'} key={image.id}><Image fill src={assetUrl(image.url)} alt={image.alt} sizes="(max-width: 900px) 100vw, 50vw" /></div>
          ))}
        </div>
        <div className="detailGrid">
          <div>
            <div className="detailSpecs"><div><strong>{property.areaM2}</strong><span>m²</span></div><div><strong>{property.bedrooms}</strong><span>habitaciones</span></div><div><strong>{property.bathrooms}</strong><span>baños</span></div><div><strong>{property.parking}</strong><span>parqueaderos</span></div></div>
            <h2>Descripción</h2><p className="longText">{property.description}</p>
            <h2>Características</h2><div className="features">{property.features.map((feature) => <span key={feature}>✓ {feature}</span>)}</div>
          </div>
          <aside className="card inquiry"><h2>Me interesa este inmueble</h2><p>Déjanos tus datos y coordinaremos la visita.</p><ContactForm propertyTitle={property.title} /></aside>
        </div>
      </div>
    </section>
  );
}
