# Saipr_project — 함께읽기

책 콘텐츠를 소유하지 않고, 같은 책을 읽는 친구·팀의 **진행률 · 문단 반응 · 대결**을 실시간/비동기로 연결하는 소셜 독서 레이어.

- 📄 [PRD](docs/PRD.md) · 🎨 [디자인 시스템](docs/design-system.md) · 🏗 [아키텍처](docs/architecture.md) · 🎯 [GOAL](GOAL.md)
- 🖼 Figma: [MVP Screens](https://www.figma.com/design/mp2nKNmBdJ7Dg2rc2p9rht)

## 빠른 시작

```bash
cp .env.example .env          # API 키는 선택 — 없으면 Gutendex·위키문헌·Google Books만 사용
docker compose up --build     # Postgres + API (마이그레이션 자동 적용)
curl "localhost:8000/api/v1/books/search?q=봄봄"
```

로컬 개발:

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pytest -q && ruff check .
uvicorn app.main:app --reload
```

## 현재 상태

Phase 0–1 완료 (스캐폴딩 · 도서 소스 어댑터 5종 · 통합 검색 · 전문 청크화). 진행 현황은 [GOAL.md](GOAL.md).
