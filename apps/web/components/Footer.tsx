import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div>
          <div className="brand footerBrand"><span className="brandMark">J</span><strong>Asesoría Inmobiliaria JB</strong></div>
          <p>Administramos inmuebles para arriendo con claridad, respaldo y acompañamiento digital.</p>
        </div>
        <div><h4>Explora</h4><Link href="/inmuebles">Inmuebles</Link><Link href="/nosotros">Quiénes somos</Link><Link href="/contacto">Contactar asesor</Link></div>
        <div><h4>Contacto</h4><p>Bogotá, Colombia</p><p>+57 601 555 0185</p><p>contacto@asesoriainmobiliariajb.com</p></div>
      </div>
      <div className="copyright">© 2026 Asesoría Inmobiliaria JB. Todos los derechos reservados.</div>
    </footer>
  );
}
