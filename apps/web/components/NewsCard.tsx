import Link from 'next/link';
import { fecha } from '@/lib/format';
import type { NewsPost } from '@/lib/types';

export function NewsCard({ newsPost }: { newsPost: NewsPost }) {
  const externalUrl = newsPost.externalUrl?.trim();
  const href = externalUrl || `/noticias/${newsPost.slug}`;
  const sourceLabel = newsPost.sourceLabel?.trim() || (externalUrl ? 'Prensa digital' : 'Asesoría Inmobiliaria JB');
  const content = (
    <>
      <div className="newsMeta"><strong>{sourceLabel}</strong><span>{fecha(newsPost.createdAt)}</span></div>
      <div className="newsBody"><h3>{newsPost.title}</h3><p>{newsPost.summary}</p></div>
      <span className="newsCta">{externalUrl ? 'Abrir noticia externa →' : 'Leer noticia →'}</span>
    </>
  );

  return externalUrl ? (
    <a className="newsCard card" href={href} rel="noreferrer noopener" target="_blank">
      {content}
    </a>
  ) : (
    <Link className="newsCard card" href={href}>
      {content}
    </Link>
  );
}