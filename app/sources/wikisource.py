from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup

from app.sources.base import BookMeta, BookSource, SourceError

# 본문이 아닌 요소: 편집 링크, 각주, 표(머리말 틀), 목차, 인쇄 제외 영역
_NOISE = (
    ".mw-editsection, sup.reference, ol.references, .reference, table, style, script, "
    ".noprint, #toc, .toc, .ws-noexport"
)


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for el in soup.select(_NOISE):
        el.decompose()
    for br in soup.find_all("br"):
        br.replace_with("\n")
    paragraphs = []
    for block in soup.find_all(["p", "dd"]):
        lines = (" ".join(line.split()) for line in block.get_text().split("\n"))
        para = "\n".join(line for line in lines if line)
        if para:
            paragraphs.append(para)
    return "\n\n".join(paragraphs)


class WikisourceSource(BookSource):
    """위키문헌 MediaWiki API — 한국 근대문학 퍼블릭 도메인 전문. external_id = 문서 제목."""

    name = "wikisource"
    fulltext = True

    def __init__(self, client: httpx.AsyncClient, lang: str = "ko") -> None:
        super().__init__(client)
        self.lang = lang
        self.api = f"https://{lang}.wikisource.org/w/api.php"

    async def search(self, query: str, limit: int = 10) -> list[BookMeta]:
        data = await self._get_json(
            self.api,
            params={
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srnamespace": 0,
                "srlimit": min(limit, 50),
                "format": "json",
                "formatversion": 2,
            },
        )
        return [self._meta(hit["title"]) for hit in data.get("query", {}).get("search", [])]

    async def fetch_book(self, external_id: str) -> tuple[BookMeta, str]:
        data = await self._get_json(
            self.api,
            params={
                "action": "parse",
                "page": external_id,
                "prop": "text",
                "redirects": 1,
                "format": "json",
                "formatversion": 2,
            },
        )
        if "error" in data:
            raise SourceError(f"wikisource: {data['error'].get('code', 'unknown')}")
        text = html_to_text(data["parse"]["text"])
        if not text:
            # 목차만 있는 문서(하위 문서 병합, PRD EXC-07)는 Phase 2에서 지원
            raise SourceError(f"wikisource page {external_id!r} has no body text")
        return self._meta(data["parse"]["title"]), text

    def _meta(self, title: str) -> BookMeta:
        return BookMeta(
            source=self.name,
            external_id=title,
            title=title,
            language=self.lang,
            has_fulltext=True,
            link=f"https://{self.lang}.wikisource.org/wiki/{quote(title.replace(' ', '_'))}",
        )
