/**
 * FastAPI 도서 API 클라이언트 (app/api/books.py 와 응답 형태가 같다).
 *
 * 서버가 꺼져 있거나(네트워크 오류) 5xx면 목업 데이터로 대체하고 `live: false`를 돌려준다.
 * 4xx는 "요청이 잘못됨"이므로 목업으로 덮지 않고 ApiError로 그대로 올린다.
 */
import * as mock from './mock';

export type BookHit = {
  source: string;
  external_id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  has_fulltext: boolean;
  also_in: string[];
};
export type SearchResult = { items: BookHit[]; errors: Record<string, string> };
export type Book = { id: number | string; title: string; author: string | null; language: string | null; total_chunks: number };
export type Chunk = { chunk_index: number; total_chunks: number; text: string; min_dwell_ms: number };
export type Live<T> = { data: T; live: boolean };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

class Unavailable extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Unavailable('network');
  }
  if (res.status >= 500) throw new Unavailable(String(res.status));
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? res.statusText);
  }
  return res.json();
}

async function withFallback<T>(live: () => Promise<T>, fallback: () => T): Promise<Live<T>> {
  try {
    return { data: await live(), live: true };
  } catch (e) {
    if (e instanceof Unavailable) return { data: fallback(), live: false };
    throw e;
  }
}

export const searchBooks = (q: string) =>
  withFallback<SearchResult>(
    () => request(`/api/v1/books/search?q=${encodeURIComponent(q)}&limit=12`),
    () => mock.search(q),
  );

export const openBook = (source: string, externalId: string) =>
  withFallback<Book>(
    () =>
      request('/api/v1/books/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, external_id: externalId }),
      }),
    () => mock.book(source, externalId),
  );

export const getChunk = (book: Book, index: number) =>
  typeof book.id === 'string' // 목업 책은 id가 문자열
    ? Promise.resolve<Live<Chunk>>({ data: mock.chunk(index), live: false })
    : withFallback<Chunk>(() => request(`/api/v1/books/${book.id}/chunks/${index}`), () => mock.chunk(index));
