import re
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from . import design_tokens as T
from .assets import AssetManager
from .components import cover_page,project_direction_page,product_page,comparison_page
from .qa import LayoutManifest,pdf_postflight

class PresentationBuilder:
    def __init__(self,products,output_dir='presentation_output',font_dir='/tmp/isfonts'):
        self.products=products; self.out=Path(output_dir); self.assets_dir=self.out/'assets'; self.qa_dir=self.out/'qa'
        self.out.mkdir(exist_ok=True); self.qa_dir.mkdir(exist_ok=True); self.assets=AssetManager(products,self.assets_dir); self._register_fonts(Path(font_dir))
    def _register_fonts(self,font_dir):
        files={'Inter':'Inter-Regular.ttf','Inter-Medium':'Inter-Medium.ttf','Inter-Bold':'Inter-Bold.ttf','Playfair':'PlayfairDisplay-Regular.ttf'}; missing=[]
        for name,fn in files.items():
            p=font_dir/fn
            if not p.exists(): missing.append(str(p))
            else: pdfmetrics.registerFont(TTFont(name,str(p)))
        if missing: raise RuntimeError('Required fonts are missing: '+', '.join(missing))
    def build(self,job):
        self.assets.validate(job['products'])
        safe=re.sub(r'[^A-Za-z0-9]+','-',job['name']).strip('-'); path=self.out/f"CLIENT-{job['id']}-{safe}-Material-Selection.pdf"
        manifest=LayoutManifest(); c=canvas.Canvas(str(path),pagesize=(T.PAGE_W,T.PAGE_H),pageCompression=1)
        c.setTitle(f"Inner Space - {job['name']} Material Selection"); c.setAuthor('Inner Space Tiles & Wood')
        page=1; cover_page(c,job,self.products,self.assets,manifest,page); page+=1
        project_direction_page(c,job,self.products,self.assets,manifest,page); page+=1
        for key in job['products']: product_page(c,job,key,self.products,self.assets,manifest,page); page+=1
        comparison_page(c,job,self.products,self.assets,manifest,page); page+=1
        c.save(); expected=2+len(job['products'])+1
        if not manifest.validate():
            manifest.write(self.qa_dir/f"CLIENT-{job['id']}-layout-qa.json"); raise RuntimeError('Layout QA failed: '+'; '.join(manifest.errors))
        post=pdf_postflight(path,expected)
        if post:
            manifest.errors.extend(post); manifest.write(self.qa_dir/f"CLIENT-{job['id']}-layout-qa.json"); raise RuntimeError('PDF postflight failed: '+'; '.join(post))
        manifest.write(self.qa_dir/f"CLIENT-{job['id']}-layout-qa.json"); return path,expected
