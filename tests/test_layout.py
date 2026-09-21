from presentation_builder.text_layout import wrap_lines,tracked_width
def test_layout_api():
    assert callable(wrap_lines) and callable(tracked_width)
