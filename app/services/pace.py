"""체류시간(dwell time) 검증 — 퀴즈를 대체하는 치팅 방지 규칙 (PRD BTL-01).

상한 속도는 속독 상위권을 넘는 수준으로 잡아, 정상적으로 읽는 사람은 걸리지 않고
'넘기기만 하는' 경우만 걸러낸다.
"""

import math
import re

MAX_KO_CHARS_PER_MIN = 1500
MAX_EN_WORDS_PER_MIN = 600
# 탭을 켜두고 방치해 체류시간을 부풀리는 것 방지 (PRD EXC-04)
DWELL_CAP_MULTIPLIER = 10

_HANGUL = re.compile(r"[가-힣]")
_LETTER = re.compile(r"\w")


def _is_korean(text: str, language: str | None) -> bool:
    if language:
        return language == "ko"
    letters = len(_LETTER.findall(text))
    return letters > 0 and len(_HANGUL.findall(text)) / letters > 0.5


def min_dwell_ms(text: str, language: str | None = None) -> int:
    if _is_korean(text, language):
        minutes = len("".join(text.split())) / MAX_KO_CHARS_PER_MIN
    else:
        minutes = len(text.split()) / MAX_EN_WORDS_PER_MIN
    return math.ceil(minutes * 60_000)


def credited_dwell_ms(dwell_ms: int, min_ms: int) -> int:
    return max(0, min(dwell_ms, min_ms * DWELL_CAP_MULTIPLIER))


def is_verified(total_dwell_ms: int, min_ms: int) -> bool:
    """같은 청크 재방문 시 누적 체류시간으로 판정한다."""
    return total_dwell_ms >= min_ms
