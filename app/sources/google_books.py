import httpx

from app.sources.base import BookMeta, BookSource


class GoogleBooksSource(BookSource):
    """Google Books — 해외 도서 메타데이터. API 키 없이도 낮은 쿼터로 동작."""

    name = "google_books"
    URL = "https://www.googleapis.com/books/v1/volumes"

    def __init__(self, client: httpx.AsyncClient, api_key: str | None = None) -> None:
        super().__init__(client)
        self.api_key = api_key

    async def search(self, query: str, limit: int = 10) -> list[BookMeta]:
        params: dict[str, str | int] = {"q": query, "maxResults": min(limit, 40)}
        if self.api_key:
            params["key"] = self.api_key
        data = await self._get_json(self.URL, params=params)
        hits = []
        for it in data.get("items", []):
            vi = it.get("volumeInfo", {})
            ids = {x["type"]: x["identifier"] for x in vi.get("industryIdentifiers", [])}
            hits.append(
                BookMeta(
                    source=self.name,
                    external_id=it["id"],
                    title=vi.get("title", ""),
                    authors=tuple(vi.get("authors") or ()),
                    isbn13=ids.get("ISBN_13"),
                    cover_url=(vi.get("imageLinks") or {}).get("thumbnail"),
                    language=vi.get("language"),
                    link=vi.get("infoLink"),
                )
            )
        return hits
