# 아키텍처 (Phase 0–1)

```
app/
  main.py              FastAPI 앱, lifespan에서 공용 httpx.AsyncClient 생성
  core/config.py       pydantic-settings — 환경변수(.env)
  db/                  DeclarativeBase(제약 이름 규칙) · async 세션
  models.py            전체 스키마 (PRD 10장과 1:1)
  sources/             외부 도서 소스 어댑터 (어댑터 패턴)
    base.py            BookSource(ABC) · BookMeta · SourceError
    kakao/naver/google_books.py   메타데이터 전용
    gutendex/wikisource.py        퍼블릭 도메인 전문 (fetch_book 구현)
    registry.py        키가 있는 소스만 우선순위 순서로 활성화
  services/
    search.py          병렬 조회 · ISBN 병합 · 부분 실패 허용 · 전문 화이트리스트
    chunker.py         본문 → 청크 (페이지 대체 위치 단위)
    pace.py            체류시간 검증 규칙
    books.py           전문 가져오기(캐시) · 청크 조회
  api/books.py         /api/v1/books/*
migrations/            Alembic (async)
```

## 핵심 결정

| 결정 | 이유 |
|---|---|
| **어댑터 패턴** — 소스마다 `search`, 전문 소스만 `fetch_book` | 출판사 제휴 시 파일 하나 추가로 확장 |
| **전문 화이트리스트를 코드로 강제** (`FULLTEXT_SOURCES`) | 저작권 원칙이 실수로 깨지지 않도록. 메타데이터 소스가 `has_fulltext=True`를 줘도 병합 단계에서 꺼짐 |
| **부분 실패 허용** — `asyncio.gather(return_exceptions=True)` + 소스별 `wait_for` | 한 API가 죽어도 검색은 동작 |
| **오류는 타입명만 노출** | httpx 예외 메시지에 API 키가 담긴 URL이 포함될 수 있음 |
| **청크 = 위치 단위** | 판본·기기마다 달라지는 페이지 대신 결정적 분할 결과를 공유 좌표로 사용 |
| **포인트는 append-only 원장** | 감사 추적, 잔액 = SUM |
| **테스트는 네트워크 0** | `httpx.MockTransport`로 외부 API 대체, DB는 in-memory SQLite |

## API

| Method | Path | 설명 |
|---|---|---|
| GET | `/health` | 헬스체크 |
| GET | `/api/v1/books/search?q=&limit=` | 통합 검색 → `items[]`, `errors{source: ExceptionType}` |
| POST | `/api/v1/books/import` | `{source, external_id}` 퍼블릭 도메인 전문 가져오기 (400: 비허용 소스, 422: 본문 없음, 502: 상위 장애) |
| GET | `/api/v1/books/{id}/chunks/{index}` | 청크 본문 + `min_dwell_ms` |

## 다음 Phase에서 채울 자리

- Phase 2: `app/api/auth.py`(Authlib), `library.py`, `reading_events` 수집 → `services/pace.py` 사용
- Phase 3: `app/realtime/broker.py`(인메모리 → Redis Pub/Sub 동일 인터페이스), `/ws/rooms/{id}`
