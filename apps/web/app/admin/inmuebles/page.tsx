import type { Metadata } from 'next';
import Image from 'next/image';
import { AdminNav } from '@/components/AdminNav';
import { AdminPropertyForm } from '@/components/AdminPropertyForm';
import { archivePropertyAction } from '@/app/actions';
import { apiFetch } from '@/lib/api';
import { assetUrl, pesos } from '@/lib/format';
import { requireUser } from '@/lib/auth';
import type { Property } from '@/lib/types';

export const metadata: Metadata = { title: 'Administrar inmuebles' };
export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  await requireUser('ADMIN');
  const properties = await apiFetch<Property[]>('/admin/properties', {}, true);
  return (
    <section className="section pageTop"><div className="container adminLayout"><AdminNav /><div className="adminContent">
      <div className="pageHeading compact"><span className="eyebrow">Administración</span><h1>Inmuebles</h1><p>Agrega inmuebles para arriendo y administra su publicación.</p></div>
      <AdminPropertyForm />
      <div className="card tableCard"><div className="tableTitle"><h2>Publicaciones</h2><span>{properties.length} registros</span></div>
        <div className="responsiveTable"><table><thead><tr><th>Inmueble</th><th>Ubicación</th><th>Canon</th><th>Estado</th><th /></tr></thead><tbody>{properties.map((property) => <tr key={property.id}>
          <td className="propertyRow"><div className="thumb"><Image src={assetUrl(property.images[0]?.url)} alt={property.title} fill sizes="54px" /></div>{property.title}</td><td>{property.neighborhood}, {property.city}</td><td>{pesos(property.monthlyRent)}</td><td><span className={`status ${property.status.toLowerCase()}`}>{property.status}</span></td><td>{property.status !== 'ARCHIVED' && <form action={archivePropertyAction}><input type="hidden" name="id" value={property.id}/><button className="textButton">Archivar</button></form>}</td>
        </tr>)}</tbody></table></div>
      </div>
    </div></div></section>
  );
}
