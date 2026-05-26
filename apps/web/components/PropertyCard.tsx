import Image from 'next/image';
import Link from 'next/link';
import { assetUrl, pesos } from '@/lib/api';
import type { Property } from '@/lib/types';

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="propertyCard">
      <div className="propertyImage">
        <Image src={assetUrl(property.images[0]?.url)} alt={property.images[0]?.alt ?? property.title} fill sizes="(max-width: 900px) 100vw, 33vw" />
        <span className="pill">Disponible</span>
      </div>
      <div className="propertyBody">
        <p className="location">{property.neighborhood}, {property.city}</p>
        <h3>{property.title}</h3>
        <p className="rent">{pesos(property.monthlyRent)} <small>/ mes</small></p>
        <div className="specs"><span>◻ {property.areaM2} m²</span><span>▣ {property.bedrooms} hab.</span><span>◉ {property.bathrooms} baños</span></div>
        <Link className="textLink" href={`/inmuebles/${property.slug}`}>Ver inmueble →</Link>
      </div>
    </article>
  );
}
