import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AdminNav } from '@/components/AdminNav';
import { AdminPropertyForm } from '@/components/AdminPropertyForm';
import { AdminDeletePropertyButton } from '@/components/AdminDeletePropertyButton';
import { apiFetch } from '@/lib/api';
import { assetUrl, pesos } from '@/lib/format';
import { requireUser } from '@/lib/auth';
import type { Property, TenantOption } from '@/lib/types';

export const metadata: Metadata = { title: 'Administrar inmuebles' };
export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  await requireUser('ADMIN');
  const [properties, tenants] = await Promise.all([
    apiFetch<Property[]>('/admin/properties', {}, true),
    apiFetch<TenantOption[]>('/admin/tenants', {}, true),
  ]);

  return (
    <section className="section pageTop"><div className="container adminLayout"><AdminNav /><div className="adminContent">
      <div className="pageHeading compact"><span className="eyebrow">Administración</span><h1>Inmuebles</h1><p>Agrega, edita, asigna y elimina inmuebles.</p></div>
      <AdminPropertyForm tenants={tenants} />
      <div className="card tableCard"><div className="tableTitle"><h2>Publicaciones</h2><span>{properties.length} registros</span></div>
        <div className="responsiveTable"><table><thead><tr><th>Inmueble</th><th>Ubicación</th><th>Canon</th><th>Asignado a</th><th>Estado</th><th /></tr></thead><tbody>{properties.map((property) => {
          const activeLease = property.leases?.[0];
          const assignedName = activeLease?.tenant?.name ?? activeLease?.user?.name;
          return <tr key={property.id}>
            <td className="propertyRow"><div className="thumb"><Image src={assetUrl(property.images[0]?.url)} alt={property.title} fill sizes="54px" /></div>{property.title}</td>
            <td>{property.neighborhood}, {property.city}</td>
            <td>{pesos(property.monthlyRent)}</td>
            <td>{assignedName ?? <span className="muted">Sin asignar</span>}</td>
            <td><span className={`status ${property.status.toLowerCase()}`}>{property.status}</span></td>
            <td><div className="tableActions"><Link className="textButton" href={`/admin/inmuebles/${property.id}/editar`}>Editar</Link><AdminDeletePropertyButton id={property.id} title={property.title} /></div></td>
          </tr>;
        })}</tbody></table></div>
      </div>
    </div></div></section>
  );
}
