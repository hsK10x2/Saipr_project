import httpx

from app.sources.base import BookMeta, BookSource, pick_isbn13


class KakaoSource(BookSource):
    """카카오 도서검색 — 국내 메타데이터 1순위 소스."""

    name = "kakao"
    URL = "https://dapi.kakao.com/v3/search/book"

    def __init__(self, client: httpx.AsyncClient, api_key: str) -> None:
        super().__init__(client)
        self.api_key = api_key

    async def search(self, query: str, limit: int = 10) -> list[BookMeta]:
        data = await self._get_json(
            self.URL,
            params={"query": query, "size": min(limit, 50)},
            headers={"Authorization": f"KakaoAK {self.api_key}"},
        )
        hits = []
        for d in data.get("documents", []):
            isbn = pick_isbn13(d.get("isbn"))
            hits.append(
                BookMeta(
                    source=self.name,
                    external_id=isbn or d["url"],
                    title=d["title"],
                    authors=tuple(d.get("authors") or ()),
                    isbn13=isbn,
                    cover_url=d.get("thumbnail") or None,
                    link=d.get("url"),
                )
            )
        return hits
