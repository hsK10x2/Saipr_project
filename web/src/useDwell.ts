import { useEffect, useState } from 'react';

/**
 * 현재 청크에 머문 시간(ms)을 잰다. 탭이 보이지 않는 동안은 세지 않는다 (PRD EXC-04).
 *
 * 화면 표시용이다. 실제 레이스 점수 판정은 서버가 읽기 이벤트의 타임스탬프로 다시 계산한다
 * (클라이언트 값은 조작할 수 있으므로 신뢰하지 않는다).
 */
export function useDwell(key: string, speed = 1): number {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    setMs(0);
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (document.visibilityState === 'visible') setMs((m) => m + (now - last) * speed);
      last = now;
    }, 250);
    return () => window.clearInterval(id);
  }, [key, speed]);

  return ms;
}
