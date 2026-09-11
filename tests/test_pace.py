from app.services.pace import (
    DWELL_CAP_MULTIPLIER,
    credited_dwell_ms,
    is_verified,
    min_dwell_ms,
)


def test_korean_min_dwell_is_chars_per_minute():
    assert min_dwell_ms("가" * 1500, "ko") == 60_000
    assert min_dwell_ms("가 " * 750, "ko") == 30_000  # 공백은 세지 않음


def test_english_min_dwell_is_words_per_minute():
    assert min_dwell_ms("word " * 600, "en") == 60_000


def test_language_autodetect():
    assert min_dwell_ms("가" * 1500) == 60_000
    assert min_dwell_ms("word " * 600) == 60_000


def test_skimming_is_not_verified():
    need = min_dwell_ms("가" * 1200, "ko")
    assert not is_verified(need - 1, need)
    assert is_verified(need, need)


def test_idle_tab_dwell_is_capped():
    assert credited_dwell_ms(10**9, 1000) == 1000 * DWELL_CAP_MULTIPLIER
    assert credited_dwell_ms(-5, 1000) == 0
