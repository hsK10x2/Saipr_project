import { Fragment } from 'react';
import { Header } from '../components';
import { LEAGUE } from '../mock';

export default function League() {
  return (
    <>
      <Header kicker={`제 ${LEAGUE.week}주 · ${LEAGUE.tier} · 월요일 00:00 마감`} title="이번 주 리그" />
      <span className="chip on static">상위 {LEAGUE.promote}팀 골드 리그 승급</span>
      <ol className="card surface ranking">
        {LEAGUE.teams.map((t, i) => (
          <Fragment key={t.name}>
            <li className={`rank${t.me ? ' me' : ''}${i < LEAGUE.promote ? ' top' : ''}`}>
              <span className="rank-no">{i + 1}</span>
              <span className="rank-name">
                {t.name}
                {t.me && <span className="seal">우리팀</span>}
              </span>
              <span className="dots" />
              <span className="rank-score">{t.score}</span>
            </li>
            {i === LEAGUE.promote - 1 && <li className="promo-line">승급선</li>}
          </Fragment>
        ))}
      </ol>
      <p className="soft small center">단위: 검증된 청크 · 팀 평균</p>
    </>
  );
}
