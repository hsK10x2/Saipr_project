# web/ 프론트엔드 프로토타입 설명서

## 1. 목적 및 해결 과제 (Why)
- **목적**: 디자인 시안 A(유리)·B(종이 서재)를 이미지가 아니라 **실제로 조작해 보고** 고르도록, 설정에서 테마를 바꾸는 모바일 웹 프로토타입. 동시에 PRD의 핵심 규칙(청크 위치·체류시간 검증·스포일러 가드)을 화면에서 확인한다.
- **입출력**: 입력 = 사용자 조작 + FastAPI(`/api/v1/books/*`) 응답 / 출력 = 7개 화면. API가 죽어 있으면 `mock.ts` 데이터로 대체.

| 파일 | 역할 |
| :--- | :--- |
| `src/main.tsx` | 진입점. `SettingsProvider`로 감싸고 CSS 3개(base·glass·paper) 로드 |
| `src/App.tsx` | 해시 라우트에 따라 화면 1개 렌더 + 배경·탭바·토스트 |
| `src/settings.tsx` | 테마·스포일러 가드·시연용 가속 설정 (Context + localStorage) |
| `src/router.ts` | 의존성 없는 해시 라우터 (`#/reader/wikisource:봄봄`) |
| `src/api.ts` | FastAPI 클라이언트 + 장애 시 목업 폴백 |
| `src/mock.ts` | 오프라인 데모 데이터, 아직 API가 없는 읽기방·레이스·리그 데이터 |
| `src/useDwell.ts` | 현재 청크 체류시간 측정 훅 |
| `src/components.tsx` | 공용 UI + 테마별 장식(`Backdrop`, `Emblem`) |
| `src/screens/*.tsx` | 홈·검색·리더·읽기방·레이스·리그·설정 |
| `src/styles/base.css` | 레이아웃. 색·재질은 **CSS 변수로만** 참조 |
| `src/styles/glass.css` · `paper.css` | `[data-theme]` 별 변수 값 + 테마 전용 장식 |

## 2. 핵심 동작 흐름 (How)

### 2-1. 테마 전환
| 단계 | 함수 / 위치 | 역할 |
| :--- | :--- | :--- |
| 1 | `load()` (`settings.tsx` L21) | localStorage `saipr.settings` 복원 → `?theme=paper` 쿼리가 있으면 우선 (L29) |
| 2 | `SettingsProvider` (L37) | 설정 상태 보관, `update(patch)`로 부분 갱신 |
| 3 | `useEffect` (L40–42) | `document.documentElement.dataset.theme = theme` → `<html data-theme="paper">` |
| 4 | `glass.css` / `paper.css` | `:root[data-theme='…']` 셀렉터가 `--surface`, `--font-display` 등 변수 값을 교체 |
| 5 | `Backdrop()` · `Emblem()` (`components.tsx` L39, L59) | CSS로 못 바꾸는 **구조 차이**(풍경 레이어, 유리구슬 ↔ 책)만 JS에서 분기 |

### 2-2. 리더 (`screens/Reader.tsx`)
| 단계 | 위치 | 역할 및 데이터 변환 |
| :--- | :--- | :--- |
| 1 | `useEffect` L30 | `openBook(source, id)` → 서버가 위키문헌 전문을 가져와 청크로 저장, `Book` 반환 |
| 2 | `useEffect` L40 | `getChunk(book, index)` → 청크 본문 + `min_dwell_ms` |
| 3 | `useDwell()` L60 | 청크별 체류시간(ms). 시연용 설정이면 속도 ×10 |
| 4 | `useEffect` L63 | `dwell >= min_dwell_ms` 이면 `verified`에 청크 번호 추가 (1회만) |
| 5 | L70–73 | `readUpTo = max(verified)`. 이보다 뒤 청크의 반응은 내용 대신 **개수만** (`locked`) |
| 6 | `useEffect` L49 | `{index, verified}`를 `saipr.read.<bookKey>`에 저장 → 새로고침해도 이어 읽기 |

### 2-3. API 폴백 (`api.ts`)
| 단계 | 위치 | 역할 |
| :--- | :--- | :--- |
| 1 | `request()` L31 | `fetch` 실패(서버 꺼짐) 또는 5xx → `Unavailable` (L36, L38). 4xx → `ApiError` |
| 2 | `withFallback()` L46 | `Unavailable`만 잡아서 목업 반환 + `live: false` (L50). `ApiError`는 그대로 throw |
| 3 | `LiveBadge` | `live === false`면 화면에 "오프라인 데모" 배지 |

- **분기 주의**: 4xx(예: 전문 없는 소스로 import → 400)는 **목업으로 덮지 않는다**. 잘못된 요청을 가짜 성공으로 숨기면 버그를 못 찾는다.

## 3. 💡 주니어 개발자를 위한 핵심 학습 포인트 (Study)

- **[Design Token / CSS Custom Properties 기반 테마]**
  - **개념**: 컴포넌트는 `var(--surface)`처럼 "의미 이름"만 쓰고, 실제 값은 테마별 CSS가 채운다. 테마 전환 = 루트 속성 1개 변경.
  - **선택 이유 & 대안**: CSS-in-JS의 `ThemeProvider`로 props를 흘리면 테마 변경 시 트리 전체가 **re-render**된다. CSS 변수는 브라우저가 스타일만 다시 계산하므로 React 렌더가 0회. 대신 "구조가 다른" 부분(유리구슬 vs 책)은 CSS로 못 하므로 `Emblem`처럼 JS 분기를 최소한으로 둔다.

- **[React Context + 영속화 (Persistence)]**
  - `SettingsProvider`는 **Single Source of Truth**. 저장은 `useEffect`의 **side effect**로 분리해 렌더 함수를 **pure**하게 유지.
  - `localStorage`는 사생활 보호 모드에서 예외를 던질 수 있어 `try/catch` — 저장 실패해도 앱은 메모리 상태로 동작 (**Graceful Degradation**).

- **[Graceful Degradation / Fallback 패턴]**
  - `withFallback`은 "인프라 장애"와 "클라이언트 오류"를 **타입(에러 클래스)으로 구분**한다. 문자열 비교보다 안전하고, `instanceof` 한 줄로 분기.
  - 대안: 서비스 워커 캐시·MSW 목 서버. 프로토타입에선 과하다.

- **[Stale Response / Race Condition 방지]** (`Search.tsx` L22)
  - 입력마다 요청하면 느린 이전 응답이 최신 결과를 덮는다. `cancelled` 플래그 + `setTimeout` **Debounce(350ms)** 로 해결. cleanup 함수가 이전 effect를 무효화하는 React 관용구.
  - 대안: `AbortController`로 요청 자체 취소 (네트워크 절약까지 원하면 이쪽).

- **[클라이언트 값은 신뢰하지 않는다 (Never Trust the Client)]** (`useDwell.ts`)
  - 체류시간은 **화면 표시용**. 실제 레이스 점수는 서버가 이벤트 타임스탬프로 재계산한다(PRD BTL-01). 클라이언트 타이머는 개발자 도구로 조작 가능.
  - `document.visibilityState` 체크(L17)로 탭을 켜두고 방치하는 **dwell inflation**을 1차 차단.

- **[Deterministic Pseudo-Random]** (`Race.tsx` `Shelf` L64)
  - 책장 높이를 `Math.random()`으로 만들면 렌더마다 모양이 바뀌어 **깜빡임** + 스크린샷 비교 불가. **LCG**(`s = (s*9301+49297) % 233280`)로 seed 고정.

- **[의존성 없는 Hash Router]** (`router.ts` L8)
  - 정적 호스팅에서 새로고침해도 404가 안 나는 게 해시 라우팅의 장점. 화면 7개 수준이면 `react-router` 없이 `hashchange` 이벤트로 충분. 중첩 라우트·로더가 필요해지면 교체.

## 4. 실전 사용법 (Usage)

```bash
# 1) (선택) 백엔드 — 켜면 실제 위키문헌 본문, 안 켜면 목업
source .venv/bin/activate                          # Windows: .venv\Scripts\activate
DATABASE_URL="sqlite+aiosqlite:///./_proto.db" alembic upgrade head
DATABASE_URL="sqlite+aiosqlite:///./_proto.db" uvicorn app.main:app --port 8000

# 2) 프론트엔드
cd web
npm install
npm run dev            # http://localhost:5173  (/api → :8000 프록시)
```

- 테마 링크 공유: `http://localhost:5173/?theme=paper` · `?theme=glass`
- 체류시간 검증을 빨리 보려면: 설정 → "체류시간 빠르게 (시연용)"
- 새 테마 추가: `settings.tsx`의 `THEMES`에 id 추가 → `styles/<id>.css`에 `:root[data-theme='<id>']` 변수 전부 정의 → `main.tsx`에서 import

## 5. 실무 관점의 한계점 & 주의사항 (Caveats & Edge Cases)
- **데이터**: 읽기방·레이스·리그·반응은 전부 `mock.ts`. 반응은 어떤 책이든 청크 번호로 붙는 데모 데이터.
- **리더 첫 진입 지연**: 처음 여는 책은 서버가 위키문헌에서 전문을 받아 청크화하므로 수 초 걸린다(이후는 DB 캐시). 로딩 스켈레톤 미구현.
- **목차형 문서**: 위키문헌 문서가 하위 문서 목차뿐이면 서버가 422 → 리더에 오류 표시 (PRD EXC-07, Phase 2).
- **`backdrop-filter` 비용**: 유리 테마는 저사양 안드로이드에서 스크롤 시 프레임 드롭 가능. `@supports not` / `prefers-reduced-transparency`에서 불투명 표면으로 대체해 두었다.
- **`:has()` 셀렉터**: 유리 테마 레이스 화면의 밤 배경은 `.app:has(.scoreboard)`에 의존 — 구형 브라우저에선 낮 배경으로 보인다(기능 영향 없음).
- **진행률 저장 위치**: `localStorage`라서 기기 간 동기화 안 됨. Phase 2에서 `library_entries` API로 이관.
- **테스트 없음**: 프로토타입 범위. 확정 테마로 본 구현 시 Vitest + Testing Library로 `withFallback`·스포일러 가드 로직부터 단위 테스트.
