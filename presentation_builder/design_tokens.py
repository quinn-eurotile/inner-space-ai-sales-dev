from dataclasses import dataclass
from reportlab.lib.colors import HexColor

@dataclass(frozen=True)
class Typography:
    font:str; size:float; leading:float; tracking:float=0.0; min_size:float=0.0; uppercase:bool=False

@dataclass(frozen=True)
class Box:
    x:float; y:float; w:float; h:float

PAGE_W=595.276
PAGE_H=841.89
MARGIN_X=52.0
MARGIN_TOP=56.0
MARGIN_BOTTOM=48.0
CONTENT_W=PAGE_W-2*MARGIN_X

BLACK=HexColor('#1D1D1B')
GREY=HexColor('#6F6D68')
MID=HexColor('#A9A59F')
LINE=HexColor('#D9D5CF')
PALE=HexColor('#F4F2EE')
WARM=HexColor('#ECE7DE')
WHITE=HexColor('#FFFFFF')

TYPE={
'eyebrow':Typography('Inter-Medium',6.8,8.0,2.0,6.0,True),
'cover_brand':Typography('Inter-Medium',6.6,8.0,2.2,6.0,True),
'cover_kicker':Typography('Inter-Medium',6.0,7.5,1.7,5.8,True),
'cover_title':Typography('Playfair',30.0,34.0,0.0,24.0,False),
'page_title':Typography('Playfair',26.0,31.0,0.0,22.0,False),
'product_title':Typography('Playfair',25.5,30.0,0.0,20.0,False),
'body':Typography('Inter',9.0,12.5,0.0,8.2,False),
'body_small':Typography('Inter',7.4,10.5,0.0,6.8,False),
'spec_label':Typography('Inter-Bold',6.0,7.5,1.1,5.7,True),
'spec_value':Typography('Inter',7.3,9.2,0.0,6.7,False),
'table_header':Typography('Inter-Bold',5.5,7.0,0.8,5.2,True),
'table_body':Typography('Inter',6.25,8.0,0.0,5.9,False),
'table_product':Typography('Inter-Medium',6.6,8.2,0.0,6.1,False),
'footer':Typography('Inter-Medium',5.8,7.0,0.9,5.5,True),
}

GUTTER=17.0
TWO_COL_W=(CONTENT_W-GUTTER)/2
PRODUCT_IMAGE_H=255.0
PRODUCT_IMAGE_Y=PAGE_H-385.0
PRODUCT_LEFT_BOX=Box(MARGIN_X,PRODUCT_IMAGE_Y,TWO_COL_W,PRODUCT_IMAGE_H)
PRODUCT_RIGHT_BOX=Box(MARGIN_X+TWO_COL_W+GUTTER,PRODUCT_IMAGE_Y,TWO_COL_W,PRODUCT_IMAGE_H)
PRODUCT_RATIONALE_LABEL_Y=PRODUCT_IMAGE_Y-34.0
PRODUCT_RATIONALE_BOX=Box(MARGIN_X+142.0,PRODUCT_IMAGE_Y-92.0,PAGE_W-MARGIN_X-(MARGIN_X+142.0),70.0)
PRODUCT_SPEC_RULE_Y=PRODUCT_IMAGE_Y-128.0

FOOTER_RULE_Y=PAGE_H-806.0
FOOTER_TEXT_Y=29.0
COVER_TEXT_X=MARGIN_X
COVER_TEXT_BOTTOM=70.0
COVER_TEXT_W=360.0
COVER_GRADIENT_H=245.0

DIRECTION_IMAGE_GAP=12.0
DIRECTION_IMAGE_W=(CONTENT_W-DIRECTION_IMAGE_GAP)/2
DIRECTION_IMAGE_H=132.0
DIRECTION_IMAGE_BASE_Y=PAGE_H-595.0

TABLE_TOP_Y=PAGE_H-156.0
TABLE_CELL_PAD_X=5.0
TABLE_CELL_PAD_Y=7.0
TABLE_ROW_MIN_H=32.0
TABLE_BOTTOM_LIMIT=245.0
