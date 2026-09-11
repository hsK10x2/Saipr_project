import httpx

from app.core.config import Settings
from app.sources.base import BookSource
from app.sources.google_books import GoogleBooksSource
from app.sources.gutendex import GutendexSource
from app.sources.kakao import KakaoSource
from app.sources.naver import NaverSource
from app.sources.wikisource import WikisourceSource


def build_sources(client: httpx.AsyncClient, settings: Settings) -> dict[str, BookSource]:
    """활성 소스를 병합 우선순위 순서로 반환. 키가 없는 소스는 제외된다.

    알라딘은 법인 사업자 약관 제약으로 의도적으로 제외 (PRD 0장).
    """
    sources: list[BookSource] = []
    if settings.kakao_rest_api_key:
        sources.append(KakaoSource(client, settings.kakao_rest_api_key))
    if settings.naver_client_id and settings.naver_client_secret:
        sources.append(NaverSource(client, settings.naver_client_id, settings.naver_client_secret))
    sources.append(GoogleBooksSource(client, settings.google_books_api_key))
    sources.append(WikisourceSource(client, settings.wikisource_lang))
    sources.append(GutendexSource(client))
    return {s.name: s for s in sources}
