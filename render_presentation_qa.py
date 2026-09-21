import glob, json
from pathlib import Path
import fitz
from PIL import Image

out=Path('presentation_output/qa'); out.mkdir(parents=True,exist_ok=True)
summary=['# Presentation Builder v1.0 QA','']
for pdf in sorted(glob.glob('presentation_output/*.pdf')):
    stem=Path(pdf).stem; render_dir=out/f'{stem}-pages'; render_dir.mkdir(exist_ok=True)
    doc=fitz.open(pdf); thumbs=[]
    for i,p in enumerate(doc):
        pix=p.get_pixmap(matrix=fitz.Matrix(1.45,1.45),alpha=False)
        im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
        im.save(render_dir/f'page-{i+1:02d}.png')
        thumb=im.copy(); thumb.thumbnail((260,370)); thumbs.append(thumb)
    cols=3; gap=12; cw=260; ch=370; rows=(len(thumbs)+cols-1)//cols
    sheet=Image.new('RGB',(cols*cw+(cols+1)*gap,rows*ch+(rows+1)*gap),'white')
    for idx,im in enumerate(thumbs): sheet.paste(im,(gap+(idx%cols)*cw,gap+(idx//cols)*ch))
    sheet.save(out/f'{stem}-contact.jpg',quality=90)
    qafile=out/f"CLIENT-{stem.split('-')[1]}-layout-qa.json"
    qa=json.loads(qafile.read_text()) if qafile.exists() else {'ok':False,'errors':['missing layout qa']}
    summary += [f'## {stem}',f'- Pages rendered: {len(doc)}',f"- Layout QA: {'PASS' if qa.get('ok') else 'FAIL'}"]
    for err in qa.get('errors',[]): summary.append(f'- Error: {err}')
    summary.append(''); doc.close()
(out/'QA-SUMMARY.md').write_text('\n'.join(summary),encoding='utf-8')
