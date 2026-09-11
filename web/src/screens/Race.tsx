import { Header } from '../components';
import { RACE } from '../mock';
import { go, readerPath } from '../router';
import { useSettings } from '../settings';

const CHUNKS_PER_BOOK = 8;
const SPINE_COLORS = ['#6e5238', '#9c3b2c', '#34496e', '#2f5a44', '#8a6f3c', '#5b4a6b', '#3f3a35'];

export default function Race() {
  const { settings } = useSettings();
  const { ours, theirs } = RACE;
  const share = ours.score / (ours.score + theirs.score);

  return (
    <>
      <button className="link back" onClick={() => history.back()}>
        ‹ 돌아가기
      </button>
      <Header kicker={`페이지 레이스 · 『${RACE.book}』`} title={`${RACE.remaining} 남음`} />

      <section className="card surface scoreboard">
        <div>
          <div className="team ours">{ours.name}</div>
          <div className="score ours">{ours.score}</div>
        </div>
        <span className="versus">{settings.theme === 'paper' ? '대' : 'vs'}</span>
        <div className="right">
          <div className="team">{theirs.name}</div>
          <div className="score theirs">{theirs.score}</div>
        </div>
      </section>

      {settings.theme === 'paper' ? (
        <div className="shelves">
          <Shelf books={Math.round(ours.score / CHUNKS_PER_BOOK)} seed={7} label={`우리 책장 · ${CHUNKS_PER_BOOK}청크 = 한 권`} />
          <Shelf books={Math.round(theirs.score / CHUNKS_PER_BOOK)} seed={3} label={`${theirs.name} 책장`} faded />
        </div>
      ) : (
        <div className="tug" aria-label={`점유율 ${Math.round(share * 100)}%`}>
          <i style={{ width: `${share * 100}%` }} />
        </div>
      )}

      <section className="card surface contrib">
        <h2 className="card-title">팀 기여</h2>
        {RACE.contributors.map((c) => (
          <div key={c.name} className={`leader-row${c.me ? ' me' : ''}`}>
            <span>{c.name}</span>
            <span className="dots" />
            <span>
              {c.chunks} 청크 <em className="soft small">검증 {c.verified}%</em>
            </span>
          </div>
        ))}
      </section>
      <p className="soft small">빠르게 넘긴 청크는 점수에 반영되지 않아요. 천천히 읽어도 괜찮아요.</p>
      <button className="btn wide" onClick={() => go(readerPath('wikisource', RACE.book))}>
        이어 읽고 점수 올리기
      </button>
    </>
  );
}

function Shelf({ books, seed, label, faded }: { books: number; seed: number; label: string; faded?: boolean }) {
  // 결정적 의사난수 — 렌더링마다 책 높이·색이 바뀌지 않게
  let s = seed;
  const spines = Array.from({ length: books }, () => {
    s = (s * 9301 + 49297) % 233280;
    return { h: 62 + (s % 30), c: SPINE_COLORS[s % SPINE_COLORS.length] };
  });
  return (
    <div className={`shelf${faded ? ' faded' : ''}`}>
      <div className="spines">
        {spines.map((b, i) => (
          <i key={i} style={{ height: b.h, backgroundColor: b.c }} />
        ))}
      </div>
      <span className="soft small">{label}</span>
    </div>
  );
}
