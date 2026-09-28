import io, os, hashlib
from pathlib import Path
import requests
from PIL import Image,ImageOps
from reportlab.lib.utils import ImageReader
from .catalog_read import CatalogReadClient, resolve_assets

class AssetManager:
    def __init__(self,products,asset_dir:Path,catalog_client=None):
        self.products=products; self.asset_dir=asset_dir; self.asset_dir.mkdir(parents=True,exist_ok=True)
        self.catalog_client=catalog_client if catalog_client is not None else CatalogReadClient()
        self.resolved_products={}
    def resolve(self,key):
        if key not in self.resolved_products:
            self.resolved_products[key]=resolve_assets(self.products[key],self.catalog_client)
        return self.resolved_products[key]
    def get(self,key,kind):
        p=self.resolve(key); url=p['image' if kind=='image' else 'life']
        if not url: raise RuntimeError(f'{key}: no catalogue {kind} asset; no scraping or generation fallback')
        digest=hashlib.sha256(url.encode()).hexdigest()[:16]
        ext='.jpg' if '.jpg' in url.lower() or '.jpeg' in url.lower() else '.png'
        path=self.asset_dir/f'{key}_{kind}_{digest}{ext}'
        norm=self.asset_dir/f'{key}_{kind}_{digest}.jpg'
        # Preserve the pre-integration source/normalisation path: after validation,
        # PNGs render from original cached bytes, not an extra JPEG conversion.
        if path.exists() and path.stat().st_size>5000: return path
        r=requests.get(url,timeout=60,headers={'User-Agent':'Mozilla/5.0 InnerSpacePresentation/1.0'}); r.raise_for_status(); path.write_bytes(r.content)
        im=Image.open(path).convert('RGB')
        if max(im.size)>1800: im.thumbnail((1800,1800),Image.Resampling.LANCZOS)
        im.save(norm,'JPEG',quality=94,subsampling=0); return norm
    def validate(self,keys):
        for key in sorted(set(keys)):
            for kind in ('image','life'):
                p=self.get(key,kind)
                with Image.open(p) as im: im.verify()
                if os.path.getsize(p)<5000: raise RuntimeError(f'Asset too small: {p}')
    @staticmethod
    def draw_crop(canvas,path,x,y,w,h):
        im=Image.open(path).convert('RGB')
        target=ImageOps.fit(im,(max(20,int(w*2.2)),max(20,int(h*2.2))),method=Image.Resampling.LANCZOS)
        bio=io.BytesIO(); target.save(bio,'JPEG',quality=92,subsampling=0); bio.seek(0)
        canvas.drawImage(ImageReader(bio),x,y,w,h,mask='auto')
