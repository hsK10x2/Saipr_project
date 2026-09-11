"""본문을 '청크'로 나눈다. 청크는 판본·기기와 무관한 공통 위치 단위 (PRD BOOK-02).

규칙: 문단 경계를 존중하고, 목표 글자 수를 넘기기 직전에 자른다.
한 문단이 목표의 2배를 넘을 때만 문장 경계에서 쪼갠다. 결과는 입력에 대해 결정적이다.
"""

import re

TARGET_CHARS = {"ko": 1200}
DEFAULT_TARGET = 1800

_PARA_BREAK = re.compile(r"\n\s*\n")
_SENTENCE_END = re.compile(r"(?<=[.!?。？！…])\s+")


def target_for(language: str | None) -> int:
    return TARGET_CHARS.get(language or "", DEFAULT_TARGET)


def split_paragraphs(text: str) -> list[str]:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return [p.strip() for p in _PARA_BREAK.split(text) if p.strip()]


def _split_long(paragraph: str, target: int) -> list[str]:
    if len(paragraph) <= target * 2:
        return [paragraph]
    pieces: list[str] = []
    cur = ""
    for sentence in _SENTENCE_END.split(paragraph):
        if cur and len(cur) + 1 + len(sentence) > target:
            pieces.append(cur)
            cur = sentence
        else:
            cur = f"{cur} {sentence}" if cur else sentence
    if cur:
        pieces.append(cur)
    return pieces


def chunk_text(text: str, target: int = DEFAULT_TARGET) -> list[str]:
    chunks: list[str] = []
    cur: list[str] = []
    size = 0
    for para in split_paragraphs(text):
        for piece in _split_long(para, target):
            if cur and size + len(piece) > target:
                chunks.append("\n\n".join(cur))
                cur, size = [], 0
            cur.append(piece)
            size += len(piece)
    if cur:
        chunks.append("\n\n".join(cur))
    return chunks
