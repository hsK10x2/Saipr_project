/**
 * API 서버 없이도 화면을 시연하기 위한 데모 데이터.
 * 읽기방·레이스·리그는 Phase 3–5 API가 생기기 전까지 전부 여기서 온다.
 */
import type { Book, Chunk, SearchResult } from './api';

const CATALOG: SearchResult['items'] = [
  { source: 'wikisource', external_id: '봄봄', title: '봄봄', authors: ['김유정'], cover_url: null, has_fulltext: true, also_in: [] },
  { source: 'wikisource', external_id: '동백꽃', title: '동백꽃', authors: ['김유정'], cover_url: null, has_fulltext: true, also_in: [] },
  { source: 'kakao', external_id: '9788932000000', title: '봄봄 (한국문학 전집 12)', authors: ['김유정'], cover_url: null, has_fulltext: false, also_in: ['naver'] },
  { source: 'google_books', external_id: 'g-spring', title: 'Spring, Spring', authors: ['Kim Yu-jeong'], cover_url: null, has_fulltext: false, also_in: [] },
];

export function search(q: string): SearchResult {
  const hits = CATALOG.filter((b) => b.title.includes(q) || b.authors.some((a) => a.includes(q)));
  return { items: hits.length ? hits : CATALOG, errors: {} };
}

// 오프라인 데모 본문. 실제 본문은 API 서버를 켜면 위키문헌에서 불러온다.
const CHUNKS = [
  '"장인님! 인제 저……"\n\n내가 이렇게 뒤통수를 긁고, 나이가 찼으니 성례를 시켜 줘야 하지 않겠느냐고 채근이면 그 대답이 늘 "이 자식아! 성례구 뭐구 미처 자라야지!" 하고 만다.',
  '이 자라야 한다는 것은 내 아내가 될 점순이의 키 말이다.\n\n(오프라인 데모 발췌입니다. FastAPI 서버를 켜면 위키문헌에서 전문을 불러와 청크 단위로 읽을 수 있어요.)',
  '(데모 청크 3) 청크는 판본과 기기에 상관없이 모두에게 같은 위치를 가리키는 단위예요. 친구의 반응도 이 청크에 붙어서, 같은 문단 옆에 겹쳐 보입니다.',
  '(데모 청크 4) 너무 빨리 넘긴 청크는 검증되지 않아 레이스 점수에 들어가지 않아요. 설정에서 "체류시간 빠르게"를 켜면 검증을 금방 확인할 수 있어요.',
];

export const book = (source: string, externalId: string): Book => ({
  id: `mock:${source}:${externalId}`,
  title: externalId,
  author: '김유정',
  language: 'ko',
  total_chunks: CHUNKS.length,
});

export function chunk(index: number): Chunk {
  const text = CHUNKS[Math.min(index, CHUNKS.length - 1)];
  return {
    chunk_index: index,
    total_chunks: CHUNKS.length,
    text,
    // 서버(app/services/pace.py)와 같은 규칙: 한글 1,500자/분
    min_dwell_ms: Math.ceil((text.replace(/\s/g, '').length / 1500) * 60_000),
  };
}

export type Reaction = { chunk: number; who: string; color: string; text: string; likes: number };
export const REACTIONS: Reaction[] = [
  { chunk: 0, who: '민지', color: '#22a06b', text: '성례구 뭐구 ㅋㅋ 장인님 매년 이 소리', likes: 2 },
  { chunk: 1, who: '준호', color: '#f59e0b', text: '점순이 키가 기준이라니… 3년 7개월 실화?', likes: 1 },
  { chunk: 2, who: '서연', color: '#3b82f6', text: '여기서부터 분위기 바뀌는 거 느껴져?', likes: 3 },
  { chunk: 3, who: '서연', color: '#3b82f6', text: '결말 보고 다시 첫 장 읽어봐', likes: 4 },
];

export type Member = { name: string; initial: string; color: string; pct: number; note?: string; me?: boolean };
export const ROOM = {
  name: '국문과 봄봄 뽀개기',
  book: '봄봄',
  author: '김유정',
  mode: '비동기',
  due: '9월 14일(일)',
  dday: 3,
  members: [
    { name: '김서연', initial: '서', color: '#3b82f6', pct: 72, note: '연속 4일' },
    { name: '나', initial: '나', color: '#1d1d1f', pct: 62, me: true },
    { name: '최민지', initial: '민', color: '#22a06b', pct: 41 },
    { name: '박준호', initial: '준', color: '#f59e0b', pct: 18, note: '리디 트래커' },
  ] satisfies Member[],
};

export const RACE = {
  book: '동백꽃',
  remaining: '2일 14시간',
  ours: { name: '우리 팀', score: 128 },
  theirs: { name: '옆 연구실', score: 86 },
  contributors: [
    { name: '이도윤', chunks: 164, verified: 98 },
    { name: '나', chunks: 131, verified: 100, me: true },
    { name: '한지우', chunks: 89, verified: 91 },
  ],
};

export const LEAGUE = {
  tier: '실버 리그',
  week: 37,
  promote: 3,
  teams: [
    { name: '북극곰 독서단', score: 412 },
    { name: '연구실 고전 레이스', score: 388, me: true },
    { name: '새벽 3시 문학회', score: 341 },
    { name: '국문과 봄봄 뽀개기', score: 290 },
    { name: '퇴근길 한 챕터', score: 244 },
    { name: '고양이와 책', score: 198 },
  ],
};
