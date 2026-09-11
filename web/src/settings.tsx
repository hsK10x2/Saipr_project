import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'glass' | 'paper';

export const THEMES: { id: Theme; name: string; desc: string }[] = [
  { id: 'glass', name: '유리', desc: '사진 같은 풍경 위에 떠 있는 유리 패널' },
  { id: 'paper', name: '종이 서재', desc: '따뜻한 종이와 명조, 연필 메모와 도장' },
];

export type Settings = {
  theme: Theme;
  /** 스포일러 가드: 내가 읽은 위치 뒤의 반응은 개수만 보여준다 (PRD ROOM-03) */
  spoilerGuard: boolean;
  /** 시연용: 체류시간을 10배 빠르게 흘려 검증을 금방 볼 수 있게 한다 */
  fastDwell: boolean;
};

const KEY = 'saipr.settings';
const DEFAULTS: Settings = { theme: 'glass', spoilerGuard: true, fastDwell: false };

function load(): Settings {
  let saved: Partial<Settings> = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    // 사생활 보호 모드 등에서 localStorage 접근이 막힐 수 있다
  }
  // ?theme=paper 링크로 특정 테마를 바로 보여줄 수 있다 (팀 공유·스크린샷용)
  const fromUrl = new URLSearchParams(location.search).get('theme');
  const theme = THEMES.some((t) => t.id === fromUrl) ? (fromUrl as Theme) : saved.theme;
  return { ...DEFAULTS, ...saved, ...(theme ? { theme } : {}) };
}

type Ctx = { settings: Settings; update: (patch: Partial<Settings>) => void };
const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    // 테마는 <html data-theme> 한 곳에서만 바뀌고, 나머지는 CSS 변수가 따라간다.
    document.documentElement.dataset.theme = settings.theme;
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* 저장 실패는 무시 — 이번 세션 동안은 메모리 상태로 동작 */
    }
  }, [settings]);

  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
