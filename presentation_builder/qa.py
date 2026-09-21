import json
from dataclasses import dataclass,asdict
from pathlib import Path
import fitz
from .design_tokens import PAGE_W,PAGE_H

@dataclass
class Record:
    page:int; kind:str; role:str; x:float; y:float; w:float; h:float; font:str=''; size:float=0; tracking:float=0; text:str=''; used_h:float=0; min_size:float=0

class LayoutManifest:
    def __init__(self):
        self.records=[]
        self.errors=[]

    def add_text(self,page,role,box,style,text,used_h=0):
        self.records.append(Record(page,'text',role,box.x,box.y,box.w,box.h,style.font,style.size,style.tracking,text,used_h,style.min_size))

    def add_box(self,page,kind,role,box):
        self.records.append(Record(page,kind,role,box.x,box.y,box.w,box.h))

    def validate(self):
        for r in self.records:
            if r.x<-0.01 or r.y<-0.01 or r.x+r.w>PAGE_W+0.01 or r.y+r.h>PAGE_H+0.01:
                self.errors.append(f'p{r.page} {r.role}: outside page bounds')
            if r.kind=='text':
                if r.used_h>r.h+0.01:
                    self.errors.append(f'p{r.page} {r.role}: clipped text')
                if r.size<=0:
                    self.errors.append(f'p{r.page} {r.role}: invalid font size')
                if r.min_size and r.size+1e-6<r.min_size:
                    self.errors.append(f'p{r.page} {r.role}: font {r.size} below minimum {r.min_size}')
                if r.role.startswith(('body','spec_value','table_body')) and abs(r.tracking)>1e-6:
                    self.errors.append(f'p{r.page} {r.role}: body tracking must be zero')
        texts=[r for r in self.records if r.kind=='text']
        for i,a in enumerate(texts):
            for b in texts[i+1:]:
                if a.page!=b.page:
                    continue
                ow=min(a.x+a.w,b.x+b.w)-max(a.x,b.x)
                oh=min(a.y+a.h,b.y+b.h)-max(a.y,b.y)
                if ow>1 and oh>1:
                    self.errors.append(f'p{a.page} overlap: {a.role} with {b.role}')
        return not self.errors

    def write(self,path):
        path=Path(path)
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps({'ok':not self.errors,'errors':self.errors,'records':[asdict(r) for r in self.records]},indent=2),encoding='utf-8')

def pdf_postflight(pdf_path,expected_pages):
    errors=[]
    doc=fitz.open(pdf_path)
    if len(doc)!=expected_pages:
        errors.append(f'expected {expected_pages} pages, got {len(doc)}')
    for i,p in enumerate(doc):
        rect=p.rect
        if abs(rect.width-PAGE_W)>1 or abs(rect.height-PAGE_H)>1:
            errors.append(f'page {i+1}: non-A4 geometry')
        try:
            p.get_pixmap(matrix=fitz.Matrix(.35,.35),alpha=False)
        except Exception as e:
            errors.append(f'page {i+1}: render failure {e}')
        for b in p.get_text('blocks'):
            x0,y0,x1,y1,*_=b
            if x0<-1 or y0<-1 or x1>rect.width+1 or y1>rect.height+1:
                sample=str(b[4]).replace('\n',' ')[:90]
                errors.append(f'page {i+1}: extracted text outside page bbox=({x0:.1f},{y0:.1f},{x1:.1f},{y1:.1f}) text={sample!r}')
    doc.close()
    return errors
