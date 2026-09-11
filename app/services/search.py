"""여러 소스를 병렬 조회해 하나의 결과로 병합한다 (PRD BOOK-01)."""

import asyncio
from collections.abc import Sequence
from dataclasses import dataclass, field, replace

from app.sources.base import BookMeta, BookSource

# 본문을 제공해도 되는 퍼블릭 도메인 소스 화이트리스트. 저작권 원칙을 코드로 강제한다.
FULLTEXT_SOURCES = frozenset({"gutendex", "wikisource"})


@dataclass(slots=True)
class SearchHit:
    meta: BookMeta
    sources: list[str] = field(default_factory=list)


@dataclass(slots=True)
class SearchResult:
    hits: list[SearchHit]
    errors: dict[str, str]


def enforce_fulltext_policy(meta: BookMeta) -> BookMeta:
    if meta.has_fulltext and meta.source not in FULLTEXT_SOURCES:
        return replace(meta, has_fulltext=False)
    return meta


async def search_all(
    sources: Sequence[BookSource], query: str, limit: int = 10, timeout: float = 3.0
) -> SearchResult:
    async def one(src: BookSource) -> list[BookMeta]:
        return await asyncio.wait_for(src.search(query, limit), timeout)

    results = await asyncio.gather(*(one(s) for s in sources), return_exceptions=True)

    hits: list[SearchHit] = []
    by_isbn: dict[str, SearchHit] = {}
    errors: dict[str, str] = {}
    for src, result in zip(sources, results, strict=True):
        if isinstance(result, BaseException):
            # 예외 메시지에는 API 키가 담긴 URL이 포함될 수 있어 타입명만 노출한다.
            errors[src.name] = type(result).__name__
            continue
        for meta in result:
            meta = enforce_fulltext_policy(meta)
            if meta.isbn13 and (hit := by_isbn.get(meta.isbn13)):
                hit.sources.append(meta.source)
                continue
            hit = SearchHit(meta, [meta.source])
            hits.append(hit)
            if meta.isbn13:
                by_isbn[meta.isbn13] = hit
    return SearchResult(hits, errors)
