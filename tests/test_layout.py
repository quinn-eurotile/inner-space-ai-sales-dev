from pathlib import Path

import fitz
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from presentation_builder import design_tokens as T
from presentation_builder.components import product_page
from presentation_builder.qa import LayoutManifest
from presentation_builder.text_layout import wrap_lines,tracked_width
from presentation_jobs.batch_20260921 import PRODUCTS


def test_layout_api():
    assert callable(wrap_lines) and callable(tracked_width)


def _register_builder_fonts():
    font_dir=Path('/tmp/isfonts')
    fonts={
        'Inter':'Inter-Regular.ttf',
        'Inter-Medium':'Inter-Medium.ttf',
        'Inter-Bold':'Inter-Bold.ttf',
        'Playfair':'PlayfairDisplay-Regular.ttf',
    }
    registered=set(pdfmetrics.getRegisteredFontNames())
    for name,filename in fonts.items():
        if name not in registered:
            pdfmetrics.registerFont(TTFont(name,str(font_dir/filename)))


class _NoopAssets:
    def get(self,key,kind):
        return f'{key}:{kind}'

    def draw_crop(self,c,path,x,y,w,h):
        # Geometry-only image stub: product-page text layout is the regression target.
        c.rect(x,y,w,h,fill=0,stroke=0)


def _io_rationale(product):
    if product.get('outdoor'):
        return product['short']+' The coordinating 20 mm option supports a considered transition to external areas while retaining the same material language.'
    return product['short']+' The internal format provides the intended large-scale floor module.'


def test_longest_current_why_selected_copy_stays_inside_safe_margin(tmp_path):
    _register_builder_fonts()
    key=max(PRODUCTS,key=lambda k: len(_io_rationale(PRODUCTS[k])))
    product=PRODUCTS[key]
    rationale=_io_rationale(product)

    # The fixed semantic regions must remain on the CLIENT-001 grid.
    body_x=T.PRODUCT_RATIONALE_BOX.x
    safe_right=T.PAGE_W-T.MARGIN_X
    body_w=safe_right-body_x
    assert abs((body_x+body_w)-safe_right)<0.001

    label=T.TYPE['spec_label']
    label_col_w=(body_x-T.GUTTER)-T.MARGIN_X
    assert tracked_width('WHY WE SELECTED IT',label.font,label.size,label.tracking)<=label_col_w

    pdf=tmp_path/'why-selected-regression.pdf'
    c=canvas.Canvas(str(pdf),pagesize=(T.PAGE_W,T.PAGE_H),pageCompression=1)
    manifest=LayoutManifest()
    job={'id':'T','name':'Regression','address':'','mode':'io','products':[key]}
    product_page(c,job,key,PRODUCTS,_NoopAssets(),manifest,1)
    c.save()

    assert manifest.validate(),manifest.errors

    doc=fitz.open(pdf)
    page=doc[0]
    needle=' '.join(rationale.split()[:4])
    matching=[b for b in page.get_text('blocks') if needle in str(b[4]).replace('\n',' ')]
    assert matching, f'Could not locate rendered rationale block for {key}'
    assert max(b[2] for b in matching)<=safe_right+0.5
    doc.close()
