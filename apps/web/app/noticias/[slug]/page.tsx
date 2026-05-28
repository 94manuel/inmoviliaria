import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { fecha } from '@/lib/format';
import type { NewsPost } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const newsPost = await apiFetch<NewsPost>(`/news/${slug}`);
  return { title: newsPost.title, description: newsPost.summary };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const newsPost = await apiFetch<NewsPost>(`/news/${slug}`);
  const paragraphs = newsPost.content.split(/\r?\n\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const sourceLabel = newsPost.sourceLabel?.trim() || 'Asesoría Inmobiliaria JB';
  return (
    <section className="section pageTop">
      <div className="container">
        <article className="newsArticle card">
          <span className="eyebrow">Noticias</span>
          <div className="newsMeta"><strong>{sourceLabel}</strong><span>{fecha(newsPost.createdAt)}</span></div>
          <h1>{newsPost.title}</h1>
          <p className="newsSummary">{newsPost.summary}</p>
          <div className="newsParagraphs">{paragraphs.map((paragraph, index) => <p key={`${newsPost.id}-${index}`}>{paragraph}</p>)}</div>
          <div className="detailActions">
            <Link className="button ghost small" href="/noticias">Volver a noticias</Link>
            {newsPost.externalUrl && <a className="button small" href={newsPost.externalUrl} rel="noreferrer noopener" target="_blank">Abrir fuente original</a>}
          </div>
        </article>
      </div>
    </section>
  );
}