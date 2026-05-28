import type { Metadata } from 'next';
import { apiFetch } from '@/lib/api';
import type { NewsPost } from '@/lib/types';
import { NewsCard } from '@/components/NewsCard';

export const metadata: Metadata = { title: 'Noticias' };
export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const news = await apiFetch<NewsPost[]>('/news');
  return (
    <section className="section pageTop">
      <div className="container">
        <div className="pageHeading"><span className="eyebrow">Noticias</span><h1>Actualidad inmobiliaria y enlaces de prensa</h1><p>Consulta nuestras novedades o abre directamente noticias publicadas en medios digitales.</p></div>
        {news.length > 0 ? (
          <div className="cardsGrid newsGrid">{news.map((newsPost) => <NewsCard newsPost={newsPost} key={newsPost.id} />)}</div>
        ) : (
          <div className="card empty">Aún no hay noticias publicadas.</div>
        )}
      </div>
    </section>
  );
}