import { Avatar, Header, Progress, toast } from '../components';
import { REACTIONS, ROOM } from '../mock';
import { go, readerPath } from '../router';

export default function Room() {
  const myPct = ROOM.members.find((m) => m.me)!.pct;
  // 내 진행률보다 앞선 위치의 쪽지는 잠근다 (데모: 청크 4개 기준으로 환산)
  const myChunk = Math.floor((myPct / 100) * 4) - 1;

  return (
    <>
      <Header kicker={`『${ROOM.book}』 ${ROOM.author} · ${ROOM.mode}`} title={ROOM.name} />
      <p className="soft small">
        목표 {ROOM.due}까지 완독 · D-{ROOM.dday}
      </p>
      <button className="btn kakao" onClick={() => toast('카카오톡 공유는 카카오 JS SDK 연동 후 동작해요 (Phase 3)')}>
        카카오톡으로 친구 초대
      </button>

      <section className="card surface members">
        <h2 className="card-title">멤버 진행률</h2>
        {ROOM.members.map((m) => (
          <div key={m.name} className={`member${m.me ? ' me' : ''}`}>
            <Avatar initial={m.initial} color={m.color} size={32} />
            <div className="member-body">
              <div className="row">
                <span>{m.name}</span>
                <span className="soft small">
                  {m.pct}%{m.note ? ` · ${m.note}` : ''}
                </span>
              </div>
              <Progress value={m.pct / 100} />
            </div>
          </div>
        ))}
      </section>

      <section className="card surface">
        <h2 className="card-title">남겨진 반응</h2>
        {REACTIONS.map((r) =>
          r.chunk <= myChunk ? (
            <div key={r.text} className="margin-note">
              <Avatar initial={r.who[0]} color={r.color} size={20} />
              <span>
                {r.text} <em>— {r.who}, 청크 {r.chunk + 1}</em>
              </span>
            </div>
          ) : (
            <div key={r.text} className="guard inline">
              <b>잠김</b> {r.who}의 반응 · 청크 {r.chunk + 1}까지 읽으면 펼쳐져요
            </div>
          ),
        )}
      </section>
      <button className="btn" onClick={() => go(readerPath('wikisource', ROOM.book))}>
        이어 읽기
      </button>
    </>
  );
}
