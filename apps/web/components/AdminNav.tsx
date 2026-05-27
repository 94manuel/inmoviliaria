import Link from 'next/link';

export function AdminNav() {
  return (
    <aside className="adminNav card">
      <p className="navLabel">Panel administrativo</p>
      <Link href="/admin">Resumen</Link>
      <Link href="/admin/inmuebles">Inmuebles</Link>
      <Link href="/admin/archivos">Archivos</Link>
      <Link href="/admin/facturas">Facturas</Link>
      <Link href="/admin/contactos">Contactos</Link>
      <Link href="/inmuebles">Ver sitio público</Link>
    </aside>
  );
}
