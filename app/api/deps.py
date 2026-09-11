import httpx
from fastapi import Depends, Request

from app.core.config import Settings, get_settings
from app.sources.base import BookSource
from app.sources.registry import build_sources


def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http


def get_sources(
    client: httpx.AsyncClient = Depends(get_http_client),
    settings: Settings = Depends(get_settings),
) -> dict[str, BookSource]:
    return build_sources(client, settings)
