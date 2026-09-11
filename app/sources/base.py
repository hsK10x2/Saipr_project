"""도서 소스 어댑터 공통 인터페이스.

새 소스(출판사 제휴 등)는 BookSource를 상속해 search / fetch_book만 구현하면 된다.
"""

import html
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, ClassVar

import httpx


class SourceError(Exception):
    """외부 소스 호출 실패 또는 소스가 지원하지 않는 요청."""


@dataclass(frozen=True, slots=True)
class BookMeta:
    source: str
    external_id: str
    title: str
    authors: tuple[str, ...] = ()
    isbn13: str | None = None
    cover_url: str | None = None
    language: str | None = None
    has_fulltext: bool = False
    link: str | None = None


_ISBN13 = re.compile(r"97[89]\d{10}")
_TAG = re.compile(r"<[^>]+>")


def pick_isbn13(raw: str | None) -> str | None:
    """'8936433598 9788936433598' 같은 복합 문자열에서 ISBN-13만 추출."""
    if not raw:
        return None
    m = _ISBN13.search(raw.replace("-", ""))
    return m.group(0) if m else None


def strip_tags(s: str) -> str:
    return html.unescape(_TAG.sub("", s)).strip()


class BookSource(ABC):
    name: ClassVar[str]
    fulltext: ClassVar[bool] = False

    def __init__(self, client: httpx.AsyncClient) -> None:
        self.client = client

    @abstractmethod
    async def search(self, query: str, limit: int = 10) -> list[BookMeta]: ...

    async def fetch_book(self, external_id: str) -> tuple[BookMeta, str]:
        """(메타데이터, 정제된 본문 텍스트) 반환. 문단은 빈 줄로 구분."""
        raise SourceError(f"{self.name} does not provide full text")

    async def _get_json(self, url: str, **kwargs: Any) -> Any:
        resp = await self.client.get(url, **kwargs)
        resp.raise_for_status()
        return resp.json()
