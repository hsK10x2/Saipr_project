from app.services.chunker import chunk_text, split_paragraphs, target_for


def test_split_paragraphs_normalizes_newlines():
    assert split_paragraphs("가\r\n\r\n나\n  \n다") == ["가", "나", "다"]


def test_chunks_respect_paragraph_boundaries():
    paras = [f"문단{i} " + "가" * 300 for i in range(10)]
    chunks = chunk_text("\n\n".join(paras), target=1000)
    assert len(chunks) > 1
    rejoined = [p for c in chunks for p in c.split("\n\n")]
    assert rejoined == paras  # 어떤 문단도 중간에서 잘리지 않음


def test_chunking_is_deterministic():
    text = "\n\n".join("문장입니다. " * 50 for _ in range(20))
    assert chunk_text(text, 1200) == chunk_text(text, 1200)


def test_oversized_paragraph_splits_on_sentences():
    para = "짧은 문장이다. " * 400  # 약 3,600자 > 2 × 1,200
    chunks = chunk_text(para, 1200)
    assert len(chunks) >= 3
    assert all(c.endswith(".") for c in chunks)
    assert all(len(c) <= 1200 for c in chunks)


def test_target_for_language():
    assert target_for("ko") == 1200
    assert target_for("en") == target_for(None) == 1800


def test_empty_text():
    assert chunk_text("  \n\n ") == []
