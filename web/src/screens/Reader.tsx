import { useEffect, useMemo, useState } from 'react';
import { ApiError, getChunk, openBook, type Book, type Chunk } from '../api';
import { Avatar, LiveBadge, Progress } from '../components';
import { REACTIONS } from '../mock';
import { go } from '../router';
import { useSettings } from '../settings';
import { useDwell } from '../useDwell';

type Saved = { index: number; verified: number[] };
const storageKey = (bookKey: string) => `saipr.read.${bookKey}`;

function loadSaved(bookKey: string): Saved {
  try {
    return { index: 0, verified: [], ...JSON.parse(localStorage.getItem(storageKey(bookKey)) ?? '{}') };
  } catch {
    return { index: 0, verified: [] };
  }
}

export default function Reader({ bookKey }: { bookKey: string }) {
  const { settings } = useSettings();
  const [source, externalId] = splitKey(bookKey);
  const [book, setBook] = useState<Book | null>(null);
  const [chunk, setChunk] = useState<Chunk | null>(null);
  const [live, setLive] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(() => loadSaved(bookKey));

  // 1) 책 열기: 서버가 전문을 가져와 청크로 저장한다 (이미 있으면 캐시)
  useEffect(() => {
    openBook(source, externalId)
      .then((r) => {
        setBook(r.data);
        setLive(r.live);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '책을 열지 못했어요'));
  }, [source, externalId]);

  // 2) 현재 청크 불러오기
  useEffect(() => {
    if (!book) return;
    setChunk(null);
    getChunk(book, saved.index).then((r) => {
      setChunk(r.data);
      if (!r.live) setLive(false);
    });
  }, [book, saved.index]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(bookKey), JSON.stringify(saved));
    } catch {
      /* 무시 */
    }
  }, [bookKey, saved]);

  // 3) 체류시간 검증 — 최소 체류시간을 채우면 이 청크를 '읽음'으로 인정
  const verifiedSet = useMemo(() => new Set(saved.verified), [saved.verified]);
  const isVerified = verifiedSet.has(saved.index);
  const dwell = useDwell(`${bookKey}#${saved.index}`, settings.fastDwell ? 10 : 1);
  const need = chunk?.min_dwell_ms ?? Infinity;

  useEffect(() => {
    if (chunk && !isVerified && dwell >= need) {
      setSaved((s) => ({ ...s, verified: [...s.verified, s.index] }));
    }
  }, [chunk, dwell, need, isVerified]);

  // 4) 스포일러 가드: 검증된 가장 먼 청크까지만 반응 내용을 보여준다
  const readUpTo = saved.verified.length ? Math.max(...saved.verified) : -1;
  const visible = (c: number) => !settings.spoilerGuard || c <= readUpTo;
  const here = REACTIONS.filter((r) => r.chunk === saved.index && visible(r.chunk));
  const locked = settings.spoilerGuard ? REACTIONS.filter((r) => r.chunk > readUpTo).length : 0;

  const total = book?.total_chunks ?? 0;
  const move = (delta: number) =>
    setSaved((s) => ({ ...s, index: Math.max(0, Math.min(total - 1, s.index + delta)) }));

  if (error)
    return (
      <div className="reader-error card surface">
        <p>{error}</p>
        <button className="btn" onClick={() => go('/search')}>
          다른 책 찾기
        </button>
      </div>
    );

  const paragraphs = chunk?.text.split(/\n\s*\n/) ?? [];
  const title = book?.title ?? externalId;

  return (
    <div className="reader">
      <div className="reader-top surface">
        <div className="row">
          <button className="link" onClick={() => history.back()}>
            ‹ {title}
          </button>
          <span className="small">
            <LiveBadge live={live} /> {total ? Math.round((verifiedSet.size / total) * 100) : 0}%
          </span>
        </div>
        <Progress value={total ? verifiedSet.size / total : 0} />
      </div>

      <article className="page">
        <div className="running-head">
          {title}
          {book?.author ? ` · ${book.author}` : ''}
        </div>
        {!chunk && <p className="soft">불러오는 중…</p>}
        {paragraphs.map((p, i) => (
          <p key={i} className={i === 0 && saved.index === 0 ? 'first' : ''}>
            {p}
          </p>
        ))}
        {here.map((r) => (
          <div key={r.text} className="margin-note">
            <Avatar initial={r.who[0]} color={r.color} size={20} />
            <span>
              {r.text} <em>· 공감 {r.likes}</em>
            </span>
          </div>
        ))}

        <div className="page-foot">
          {locked > 0 && (
            <div className="guard">
              <b>잠김</b> 앞에서 {locked}개의 반응이 기다리고 있어요
            </div>
          )}
          <DwellMeter dwell={dwell} need={need} verified={isVerified} />
          <div className="folio">
            {saved.index + 1} / {total || '…'}
          </div>
        </div>
      </article>

      <div className="reader-nav">
        <button className="btn ghost" disabled={saved.index === 0} onClick={() => move(-1)}>
          이전
        </button>
        <button className="btn" disabled={!total || saved.index >= total - 1} onClick={() => move(1)}>
          다음 청크
        </button>
      </div>
    </div>
  );
}

function DwellMeter({ dwell, need, verified }: { dwell: number; need: number; verified: boolean }) {
  if (verified) return <div className="dwell done">✓ 이 청크는 읽음으로 인정됐어요</div>;
  if (!Number.isFinite(need)) return null;
  const left = Math.max(0, Math.ceil((need - dwell) / 1000));
  return (
    <div className="dwell">
      <Progress value={dwell / need} />
      <span>천천히 읽는 중 · {left}초 후 인정</span>
    </div>
  );
}

function splitKey(key: string): [string, string] {
  const i = key.indexOf(':');
  return i < 0 ? ['wikisource', key] : [key.slice(0, i), key.slice(i + 1)];
}
