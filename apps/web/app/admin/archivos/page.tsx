import type { Metadata } from 'next';
import { AdminNav } from '@/components/AdminNav';
import { AdminFileUploadForm } from '@/components/AdminFileUploadForm';
import { apiFetch } from '@/lib/api';
import { fecha, publicApiUrl, tamanoArchivo } from '@/lib/format';
import { requireUser } from '@/lib/auth';
import type { StoredFile } from '@/lib/types';

export const metadata: Metadata = { title: 'Archivos públicos' };
export const dynamic = 'force-dynamic';

export default async function AdminFilesPage() {
  await requireUser('ADMIN');
  const files = await apiFetch<StoredFile[]>('/admin/files', {}, true);
  return (
    <section className="section pageTop"><div className="container adminLayout"><AdminNav /><div className="adminContent">
      <div className="pageHeading compact"><span className="eyebrow">Administración</span><h1>Archivos públicos</h1><p>Sube cualquier tipo de archivo a MinIO y compártelo con enlaces estables para clientes.</p></div>
      <AdminFileUploadForm />
      <div className="card tableCard"><div className="tableTitle"><h2>Biblioteca</h2><span>{files.length} registros</span></div>
        <div className="responsiveTable"><table><thead><tr><th>Archivo</th><th>Tipo</th><th>Tamaño</th><th>Fecha</th><th /></tr></thead><tbody>{files.map((file) => {
          const url = `${publicApiUrl()}${file.publicPath}`;
          const downloadUrl = `${publicApiUrl()}${file.downloadPath ?? `${file.publicPath}?download=1`}`;
          return <tr key={file.id}>
            <td><strong>{file.originalName}</strong><br /><small>{url}</small></td>
            <td>{file.mimeType}</td><td>{tamanoArchivo(file.size)}</td><td>{fecha(file.createdAt)}</td><td><a className="textLink" href={url} target="_blank" rel="noreferrer">Abrir</a> · <a className="textLink" href={downloadUrl} target="_blank" rel="noreferrer">Descargar</a></td>
          </tr>;
        })}</tbody></table></div>
      </div>
      {files.length === 0 && <div className="empty">Todavía no hay archivos cargados.</div>}
    </div></div></section>
  );
}