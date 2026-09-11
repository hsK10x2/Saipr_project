import httpx

from app.sources.base import BookMeta, BookSource, pick_isbn13, strip_tags


class NaverSource(BookSource):
    """네이버 책 검색 — 카카오 쿼터 소진 시 보조 소스."""

    name = "naver"
    URL = "https://openapi.naver.com/v1/search/book.json"

    def __init__(self, client: httpx.AsyncClient, client_id: str, client_secret: str) -> None:
        super().__init__(client)
        self.headers = {"X-Naver-Client-Id": client_id, "X-Naver-Client-Secret": client_secret}

    async def search(self, query: str, limit: int = 10) -> list[BookMeta]:
        data = await self._get_json(
            self.URL, params={"query": query, "display": min(limit, 100)}, headers=self.headers
        )
        hits = []
        for it in data.get("items", []):
            isbn = pick_isbn13(it.get("isbn"))
            authors = tuple(a for a in strip_tags(it.get("author", "")).split("^") if a)
            hits.append(
                BookMeta(
                    source=self.name,
                    external_id=isbn or it["link"],
                    title=strip_tags(it["title"]),
                    authors=authors,
                    isbn13=isbn,
                    cover_url=it.get("image") or None,
                    link=it.get("link"),
                )
            )
        return hits
