import { useEffect, useState, type ReactNode } from 'react';
import { go } from './router';
import { useSettings } from './settings';

export function Avatar({ initial, color, size = 28 }: { initial: string; color: string; size?: number }) {
  return (
    <span className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </span>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Header({ kicker, title, right }: { kicker?: string; title: string; right?: ReactNode }) {
  return (
    <header className="header">
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h1 className="title">{title}</h1>
      </div>
      {right}
    </header>
  );
}

export function LiveBadge({ live }: { live: boolean | null }) {
  if (live === null || live) return null;
  return <span className="live-badge" title="API 서버에 연결하지 못해 데모 데이터를 보여주고 있어요">오프라인 데모</span>;
}

/** 테마별 장식: 유리 = 사진 같은 풍경, 종이 = 질감만 (CSS가 담당) */
export function Backdrop() {
  const { settings } = useSettings();
  if (settings.theme !== 'glass') return null;
  return (
    <div className="backdrop" aria-hidden>
      <i className="sun" />
      <i className="hill h1" />
      <i className="hill h2" />
      <i className="hill h3" />
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`bloom b${n}`} />
      ))}
      {[0, 1, 2].map((n) => (
        <i key={n} className={`pollen p${n}`} />
      ))}
    </div>
  );
}

/** 홈 상단 상징물: 유리 = 유리구슬, 종이 = 책 */
export function Emblem({ title, author }: { title: string; author: string }) {
  const { settings } = useSettings();
  if (settings.theme === 'glass') {
    return (
      <div className="orb" aria-hidden>
        <div className="orb-face">
          <i />
          <i />
        </div>
        <div className="orb-base" />
      </div>
    );
  }
  return <BookCover title={title} author={author} />;
}

const COVER_COLORS = ['#6e5238', '#9c3b2c', '#34496e', '#2f5a44', '#8a6f3c', '#5b4a6b'];
export function BookCover({ title, author, small }: { title: string; author?: string; small?: boolean }) {
  const color = COVER_COLORS[[...title].reduce((a, c) => a + c.charCodeAt(0), 0) % COVER_COLORS.length];
  return (
    <div className={`cover${small ? ' small' : ''}`} style={{ backgroundColor: color }}>
      {title}
      {author && !small && <small>{author}</small>}
    </div>
  );
}

const TABS = [
  { path: '/', label: '홈', icon: '⌂', match: 'home' },
  { path: '/search', label: '검색', icon: '⌕', match: 'search' },
  { path: '/room', label: '읽기방', icon: '◎', match: 'room' },
  { path: '/league', label: '리그', icon: '▲', match: 'league' },
  { path: '/settings', label: '설정', icon: '⚙', match: 'settings' },
];

export function TabBar({ active }: { active: string }) {
  return (
    <nav className="tabbar surface">
      {TABS.map((t) => (
        <button key={t.path} className={t.match === active ? 'on' : ''} onClick={() => go(t.path)}>
          <b aria-hidden>{t.icon}</b>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/** 전역 토스트: toast('메시지') 를 어디서든 호출 */
export const toast = (message: string) => window.dispatchEvent(new CustomEvent('saipr:toast', { detail: message }));

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: number | undefined;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(null), 2200);
    };
    window.addEventListener('saipr:toast', on);
    return () => {
      window.removeEventListener('saipr:toast', on);
      window.clearTimeout(timer);
    };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}
