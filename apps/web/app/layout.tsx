import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: { default: 'Asesoría Inmobiliaria JB | Arriendos con confianza', template: '%s | Asesoría Inmobiliaria JB' },
  description: 'Encuentra inmuebles en arriendo y administra tus pagos de forma sencilla.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
