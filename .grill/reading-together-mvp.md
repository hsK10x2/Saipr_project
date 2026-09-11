# Grill: 함께읽기 MVP 범위 정의
Date: 2026-09-11

## Intent
밀리의서재 같은 인앱 리더 경험 위에, 친구·팀과 같은 책을 각자 페이스로 읽으며 진행률·반응·대결이 겹쳐 보이는 소셜 독서 레이어를 만든다.

## Constraints
- Python 최우선 (FastAPI 백엔드, 웹 MVP).
- 합법적으로 받을 수 있는 본문 소스만 사용.

## Key decisions
- Decision: 하이브리드 콘텐츠 모델 — 퍼블릭 도메인(Gutendex·위키문헌·Standard Ebooks)은 인앱 리더로 전문 제공, 상용 도서는 카카오/네이버/Google Books 공식 API 메타데이터 + 수동 진행률(트래커 모드). Reason: 상용 신간 본문을 제3자에게 제공하는 공개 API는 존재하지 않음(밀리의서재도 출판사 개별 계약). Alternative considered: 상용 이북 본문 크롤링 — 저작권·약관·DRM 우회 리스크로 기각.
- Decision: 퀴즈 검증 제거. Reason: 사용자 결정. 트래커 모드에서는 본문이 없어 원리적으로 불가.
- Decision: 치팅 방지는 인앱 리더의 페이지(청크)별 체류시간 검증. 최소 독서속도 미달 청크는 진행률 불인정. 트래커 모드 도서는 레이스 점수 제외. Alternative considered: 무검증/레이스 제거.
- Decision: "페이지" 대신 정규화된 위치(청크 인덱스·문단 앵커) 사용. Reason: 판본마다 페이지가 달라 "같은 페이지 반응 겹쳐보기"가 성립하지 않음.
- Decision: 이번 산출물 = 상세 PRD + 디자인(Figma, Apple DESIGN.md 기준) + Phase 0·1 코드(FastAPI 스켈레톤, DB 모델, 도서 소스 어댑터, 테스트).

## Surfaced assumptions
- "외부 이북 API로 본문을 가져온다"는 전제는 상용 도서에 대해 성립하지 않음 → 출판사 제휴 시 동일 어댑터 인터페이스로 소스 추가.
- 알라딘 API는 법인 사업자의 도서정보 서비스에 약관 제약 → MVP 기본 소스에서 제외, 카카오를 1순위 메타데이터 소스로.

## Open questions
- 출판사 제휴 파트너 후보 및 시점.
- 모바일 네이티브(Flutter/RN) 전환 시점.

## Out of scope
- 퀴즈 자동 생성/검증.
- 상용 도서 본문 저장·배포.
