import Link from 'next/link';
import { getCurrentUser } from '@/lib/api';
import { logoutAction } from '@/app/actions';
import { BrandLogo } from '@/components/BrandLogo';

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="header">
      <div className="container nav">
        <Link className="brand" href="/">
          <BrandLogo />
        </Link>
        <nav className="navLinks" aria-label="Navegación principal">
          <Link href="/">Inicio</Link>
          <Link href="/inmuebles">Inmuebles</Link>
          <Link href="/noticias">Noticias</Link>
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/contacto">Contacto</Link>
          {user?.role === 'ADMIN' && <Link href="/admin">Administración</Link>}
          {user?.role === 'USER' && <Link href="/mi-cuenta">Mi cuenta</Link>}
        </nav>
        <div className="navAuth">
          {user ? (
            <form action={logoutAction}>
              <span className="welcome">Hola, {user.name.split(' ')[0]}</span>
              <button className="button ghost small" type="submit">Salir</button>
            </form>
          ) : (
            <Link className="button small" href="/login">Ingresar</Link>
          )}
        </div>
      </div>
    </header>
  );
}
