import { useEffect, useState } from 'react';
import { searchBooks, type SearchResult } from '../api';
import { BookCover, Header, LiveBadge, toast } from '../components';
import { go, readerPath } from '../router';

type Filter = 'all' | 'full' | 'record';
const SOURCE_LABEL: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  google_books: 'Google Books',
  wikisource: '위키문헌',
  gutendex: 'Gutenberg',
};

export default function Search() {
  const [q, setQ] = useState('봄봄');
  const [filter, setFilter] = useState<Filter>('all');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [live, setLive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    let cancelled = false; // 이전 요청 응답이 늦게 도착해도 덮어쓰지 않도록
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const res = await searchBooks(query);
      if (cancelled) return;
      setResult(res.data);
      setLive(res.live);
      setLoading(false);
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q]);

  const items = (result?.items ?? []).filter((b) =>
    filter === 'all' ? true : filter === 'full' ? b.has_fulltext : !b.has_fulltext,
  );
  const failed = Object.keys(result?.errors ?? {});

  return (
    <>
      <Header title="검색" right={<LiveBadge live={live} />} />
      <label className="search surface">
        <span aria-hidden>⌕</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="책 제목이나 작가" aria-label="도서 검색" />
        {q && (
          <button className="clear" onClick={() => setQ('')} aria-label="지우기">
            ✕
          </button>
        )}
      </label>
      <div className="chips">
        {(['all', 'full', 'record'] as const).map((f) => (
          <button key={f} className={`chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>
            {{ all: '전체', full: '전문 읽기', record: '진행률 기록' }[f]}
          </button>
        ))}
      </div>

      <section className="card surface list">
        {loading && !result && <p className="soft small">찾는 중…</p>}
        {!loading && result && items.length === 0 && <p className="soft small">결과가 없어요.</p>}
        {items.map((b) => (
          <button
            key={`${b.source}:${b.external_id}`}
            className="result"
            onClick={() =>
              b.has_fulltext
                ? go(readerPath(b.source, b.external_id))
                : toast('진행률 기록은 Phase 2에서 열려요 — 지금은 전문 도서만 읽을 수 있어요')
            }
          >
            <BookCover title={b.title.split(' ')[0]} small />
            <span className="result-body">
              <strong>{b.title}</strong>
              <span className="soft small">
                {/* 위키문헌 검색 API는 저자를 주지 않는다 — 없으면 출처만 표시 */}
                {[...(b.authors.length ? [b.authors.join(', ')] : []), ...[b.source, ...b.also_in].map((s) => SOURCE_LABEL[s] ?? s)].join(' · ')}
              </span>
              <span className={`badge ${b.has_fulltext ? 'full' : 'record'}`}>{b.has_fulltext ? '전문 읽기 가능' : '진행률 기록'}</span>
            </span>
          </button>
        ))}
      </section>
      {failed.length > 0 && <p className="soft small">응답하지 않은 소스: {failed.map((s) => SOURCE_LABEL[s] ?? s).join(', ')}</p>}
    </>
  );
}
