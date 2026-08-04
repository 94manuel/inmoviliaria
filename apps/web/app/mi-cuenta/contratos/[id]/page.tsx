import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Mi contrato firmado' };
export const dynamic = 'force-dynamic';

export default async function UserContractPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser('USER');
  const { id } = await params;
  return (
    <section className="section pageTop"><div className="container">
      <div className="pageHeading compact"><span className="eyebrow">Mi cuenta · Contratos</span><h1>Contrato firmado</h1><p>Visualiza el documento cargado por la inmobiliaria o descárgalo en formato PDF.</p><Link className="textLink" href="/mi-cuenta">← Volver a mi cuenta</Link></div>
      <div className="card contractViewerCard">
        <div className="contractViewerActions"><Link className="button ghost small" href={`/documentos/contratos/${id}?download=1`}>Descargar PDF</Link></div>
        <iframe className="contractFrame" src={`/documentos/contratos/${id}`} title="Contrato firmado en PDF" />
      </div>
    </div></section>
  );
}
