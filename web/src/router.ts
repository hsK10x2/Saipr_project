import { useEffect, useState } from 'react';

// 프로토타입이라 라이브러리 없이 해시 라우팅: #/search, #/reader/wikisource:봄봄
export type Route =
  | { name: 'home' | 'search' | 'room' | 'race' | 'league' | 'settings' }
  | { name: 'reader'; bookKey: string };

export function parseRoute(hash: string): Route {
  const [, page, arg] = hash.replace(/^#/, '').split('/');
  switch (page) {
    case 'search':
    case 'room':
    case 'race':
    case 'league':
    case 'settings':
      return { name: page };
    case 'reader':
      return arg ? { name: 'reader', bookKey: decodeURIComponent(arg) } : { name: 'home' };
    default:
      return { name: 'home' };
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const go = (path: string) => {
  location.hash = path;
};

/** 책 식별자: `${source}:${external_id}` (예: wikisource:봄봄) */
export const bookKey = (source: string, externalId: string) => `${source}:${externalId}`;
export const readerPath = (source: string, externalId: string) =>
  `/reader/${encodeURIComponent(bookKey(source, externalId))}`;
