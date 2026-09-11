import { Avatar, Emblem, Header, Progress } from '../components';
import { RACE, ROOM } from '../mock';
import { go, readerPath } from '../router';

export default function Home() {
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  const me = ROOM.members.find((m) => m.me)!;

  return (
    <>
      <Header kicker={today} title="오늘도 함께 읽어요" right={<Emblem title={ROOM.book} author={ROOM.author} />} />

      <section className="card surface continue">
        <span className="kicker">이어 읽기</span>
        <strong className="book-title">{ROOM.book}</strong>
        <span className="soft">{ROOM.author} · 위키문헌 · 전문 읽기</span>
        <Progress value={me.pct / 100} />
        <div className="row">
          <span className="soft small">{me.pct}% 읽음</span>
          <button className="btn" onClick={() => go(readerPath('wikisource', ROOM.book))}>
            이어 읽기
          </button>
        </div>
      </section>

      <h2 className="section-title">내 읽기방</h2>
      <button className="card surface room-card" onClick={() => go('/room')}>
        <div className="row">
          <div>
            <strong>{ROOM.name}</strong>
            <div className="soft small">
              {ROOM.mode} · D-{ROOM.dday}
            </div>
          </div>
          <span className="avatars">
            {ROOM.members.filter((m) => !m.me).map((m) => (
              <Avatar key={m.name} initial={m.initial} color={m.color} size={26} />
            ))}
          </span>
        </div>
        <span className="note-line">서연님이 방금 18번째 청크를 읽었어요</span>
      </button>
      <button className="card surface room-card" onClick={() => go('/race')}>
        <div className="row">
          <div>
            <strong>연구실 고전 레이스</strong>
            <div className="soft small">팀전 · 페이지 레이스 · {RACE.remaining} 남음</div>
          </div>
          <span className="accent small">+{RACE.ours.score - RACE.theirs.score} 앞섬</span>
        </div>
      </button>
    </>
  );
}
