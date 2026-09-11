import { Header } from '../components';
import { THEMES, useSettings, type Settings } from '../settings';

export default function SettingsScreen() {
  const { settings, update } = useSettings();

  return (
    <>
      <Header title="설정" />

      <h2 className="section-title">테마</h2>
      <div className="theme-grid" role="radiogroup" aria-label="테마">
        {THEMES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={settings.theme === t.id}
            className={`theme-card theme-${t.id}${settings.theme === t.id ? ' on' : ''}`}
            onClick={() => update({ theme: t.id })}
          >
            <span className="theme-preview" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <strong>{t.name}</strong>
            <span className="small">{t.desc}</span>
          </button>
        ))}
      </div>

      <h2 className="section-title">읽기</h2>
      <section className="card surface">
        <Toggle
          label="스포일러 가드"
          desc="내가 아직 안 읽은 위치의 반응은 개수만 보여줘요"
          k="spoilerGuard"
          settings={settings}
          update={update}
        />
        <Toggle
          label="체류시간 빠르게 (시연용)"
          desc="검증을 10배 빨리 확인할 수 있어요. 실제 점수에는 적용되지 않아요"
          k="fastDwell"
          settings={settings}
          update={update}
        />
      </section>

      <p className="soft small center">함께읽기 프로토타입 v0.1 · 설정은 이 브라우저에만 저장돼요</p>
    </>
  );
}

function Toggle({
  label,
  desc,
  k,
  settings,
  update,
}: {
  label: string;
  desc: string;
  k: 'spoilerGuard' | 'fastDwell';
  settings: Settings;
  update: (p: Partial<Settings>) => void;
}) {
  const on = settings[k];
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <span className="soft small">{desc}</span>
      </span>
      <input type="checkbox" role="switch" checked={on} onChange={() => update({ [k]: !on })} />
      <span className={`switch${on ? ' on' : ''}`} aria-hidden />
    </label>
  );
}
