import os, io, math, textwrap, re
from pathlib import Path
import requests
from PIL import Image, ImageOps, ImageEnhance
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader

OUT=Path("presentation_output")
ASSET=OUT/"assets"
OUT.mkdir(exist_ok=True)
ASSET.mkdir(exist_ok=True)

W,H=595.276,841.89
M=52
BLACK=HexColor("#1D1D1B")
GREY=HexColor("#6F6D68")
MID=HexColor("#A9A59F")
LINE=HexColor("#D9D5CF")
PALE=HexColor("#F4F2EE")
WARM=HexColor("#ECE7DE")

font_dir=Path("/tmp/isfonts")
regular=font_dir/"Inter-Regular.ttf"
medium=font_dir/"Inter-Medium.ttf"
bold=font_dir/"Inter-Bold.ttf"
playfair=font_dir/"PlayfairDisplay-Regular.ttf"
if not all(p.exists() for p in [regular,medium,bold,playfair]):
    raise RuntimeError("Required fonts are missing")
pdfmetrics.registerFont(TTFont("Inter", str(regular)))
pdfmetrics.registerFont(TTFont("Inter-Medium", str(medium)))
pdfmetrics.registerFont(TTFont("Inter-Bold", str(bold)))
pdfmetrics.registerFont(TTFont("Playfair", str(playfair)))

PRODUCTS={
"portland":{
"name":"Portland Stone Ancient Natural",
"short":"A characterful Portland-stone porcelain with a warm beige-oatmeal base, soft fossil detail and gently weathered tonal movement.",
"internal":"120 x 120 cm · 9.5 mm · Matt",
"outdoor":"120 x 120 cm · 20 mm · Grip",
"image":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/b7570238-4158-4589-9bf1-8a50458a8f12/fa42b797-209c-4fd4-aa5f-531c18f92019-1.png",
"life":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/c0bed53c-acd8-45d2-bca2-916a14455499/c73ef46b-6482-4200-9aab-9b90d3434b18-1.png",
"character":"Warm, weathered Portland stone"
},
"firenza":{
"name":"Firenza Beige (Sable)",
"short":"A soft beige stone effect with restrained mineral detail and gentle variation, giving large-format floors a calm, natural character.",
"internal":"119.5 x 119.5 cm · 9 mm · Matt · R10",
"outdoor":"119.5 x 119.5 cm · 20 mm · Grip",
"image":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/9c83991f-b273-4255-9242-72dc3a941f68/4171d608-1b66-4121-9e42-51fceea0409c-1.png",
"life":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/a1b49598-808a-443b-a765-72c1ef60fad2/82c1fa50-c75a-4563-b515-35c5890c08b9-1.png",
"character":"Soft beige mineral stone"
},
"roma":{
"name":"Roma Stone Beige",
"short":"A quiet warm-beige limestone effect with subtle Trani-stone character, designed to read evenly across broad open-plan floors.",
"internal":"119.4 x 119.4 cm · 8.5 mm · Matt · R10",
"outdoor":"119.4 x 119.4 cm · 20 mm · Grip",
"image":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/ede7a74c-2eb6-4897-a15d-9f9a3366c02f/f4b34616-875b-4fd8-ac79-fbd1c92d6a73-1.png",
"life":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/386782fb-8a66-453b-a63b-5c6ba5960724/ef98e794-ed0a-411f-b42b-f9dcd77a8841-1.png",
"character":"Quiet architectural limestone"
},
"assisi":{
"name":"Assisi Beige",
"short":"A refined warm limestone effect with delicate sedimentary markings and subtle tonal movement, bringing natural depth without visual noise.",
"internal":"120 x 120 cm · 9 mm · Matt · R10",
"outdoor":"60 x 120 cm · 20 mm · Anti-slip",
"image":"https://uydxfxifaquwmltonhbl.supabase.co/storage/v1/object/public/product-images/products/077b681f-50bf-4213-84a6-7b06ad2e1b0b/0c294328-b7fb-4f3a-8045-b3a9e3d2a2d3.png",
"life":"https://uydxfxifaquwmltonhbl.supabase.co/storage/v1/object/public/product-images/products/077b681f-50bf-4213-84a6-7b06ad2e1b0b/21a3b4d0-50e0-42a2-a063-f22a6d1f4678.png",
"character":"Refined warm limestone"
},
"portofino":{
"name":"Portofino Beige",
"short":"A clean warm-beige stone with fine, even grain and an understated surface that creates a calm foundation for contemporary interiors.",
"internal":"119.4 x 119.4 cm · 8.5 mm · Matt",
"outdoor":"120 x 120 cm · 20 mm · Grip",
"image":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/f42be828-ada4-4529-9b45-d98aad09453f/c0fe69bd-6912-402b-9979-f4c05258a488-1.png",
"life":"https://uydxfxifaquwmltonhbl.supabase.co/storage/v1/object/public/product-images/products/752b4cbf-634f-47e3-9f02-20f0e712caa4/037141ad-f8c8-4fd6-8df3-344fcc84e98f.png",
"character":"Clean contemporary warm stone"
},
"miami":{
"name":"Miami Grande Bianco",
"short":"A very light soft-white porcelain with subtle warm-to-cool tonal variation, giving large-format floors a clean but not clinical appearance.",
"internal":"119.5 x 119.5 cm · 9 mm · Matt · R10",
"outdoor":"119.5 x 119.5 cm · 20 mm · Grip",
"image":"https://uydxfxifaquwmltonhbl.supabase.co/storage/v1/object/public/product-images/content/product_43d7bf96-7a74-4c61-8fdd-8ba19561b29d_thumbnail-1782944806098.png",
"life":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/a586a86e-a6d2-47e3-bf11-6fed18bf3bc3/f251ee9c-86f9-4920-8c18-cb9618e8002f-1.png",
"character":"Very light soft-white mineral tone"
},
"silver_nat":{
"name":"Silverstone Natural (Taupe)",
"short":"A grounded taupe porcelain with subtle sedimentary movement and warm earthy variation, particularly effective with timber and brushed metal.",
"internal":"120 x 120 cm · 9 mm · Matt",
"outdoor":"60 x 120 cm · 20 mm · Grip",
"image":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/8e438d31-1123-41a8-8202-224e99b1eb3d/ac64cbb8-9187-49d8-9a83-af2068d34846-1.png",
"life":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/a1335d7d-36e7-489b-a00a-8df44c7748eb/251f196f-b55f-4a3a-b8e0-804ed56c6313-1.png",
"character":"Warm earthy taupe stone"
},
"silver_beige":{
"name":"Silverstone Beige",
"short":"A soft warm-beige porcelain with fine speckling and subdued sedimentary detail, giving a sophisticated neutral finish across expansive floors.",
"internal":"120 x 120 cm · 9 mm · Matt",
"outdoor":None,
"image":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/362f9c7a-4918-43b5-9184-ac4f68a30621/47ac11bc-6bad-46c2-8264-14a5a4a3f720-1.png",
"life":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/8ddce37e-0d2f-4905-9979-9e6bf9ca50d4/9c6f7bfc-4e33-407e-9a38-51987285d52b-1.png",
"character":"Soft speckled warm beige"
},
"azure":{
"name":"Azure Stone",
"short":"A cool light-grey stone effect with restrained variation and a clean architectural feel, offering a cooler alternative within the selection.",
"internal":"120 x 120 cm · 10 mm · Matt",
"outdoor":None,
"image":"https://janyxvinvbdpxjlujkju.supabase.co/storage/v1/object/public/generated-previews/46cd8e69-18fd-4a2d-9825-dfd66c2f84ec/20d79f92-57da-4d8e-a0e6-7812918f1c3b-1.png",
"life":"https://uydxfxifaquwmltonhbl.supabase.co/storage/v1/object/public/product-images/lifestyle-ai/00225def-6bd2-4579-a37e-9529965af7f4/390d1850-e9c8-4152-808c-4b50a4508449.png",
"character":"Cool light-grey stone"
}
}

CLIENTS=[
{"id":"01","name":"Nick Dibble","address":"23 Park Farm Road, Bromley, BR1 2PE","mode":"io","products":["portland","firenza","roma","assisi","portofino","miami"]},
{"id":"02","name":"Phillip Heaton","address":"4 Daisy Hill, Fold, Euxton, Lancashire, PR7 6NF","mode":"io","products":["assisi","portofino","roma"]},
{"id":"03","name":"Tim Crackle","address":"9 Pinecliffe Avenue, Southbourne, BH6 3PY","mode":"io","products":["assisi","portofino","roma"]},
{"id":"04","name":"Simon Watson","address":"Grays Cottage, Durton Lane, Broughton, Lancashire, PR3 5LD","mode":"io","products":["portland","firenza","roma","assisi","portofino","miami"]},
{"id":"05","name":"Richard Dixon","address":"Newby East, Carlisle, Cumbria, CA4 8RA","mode":"io","products":["portland","firenza","roma","assisi","portofino","miami"]},
{"id":"06","name":"Gareth Harry","address":"Treetops, Bethania Row, Old St Mellons, Cardiff, CF3 5UD","mode":"io","products":["portland","firenza","roma","assisi","portofino","miami"]},
{"id":"07","name":"Jaco Van Schalkwyk","address":"7 Swanley Drive, Rochford, SS4 1ZR","mode":"internal","products":["assisi","portofino","roma"]},
{"id":"08","name":"Rada Robertson","address":"Owls Hoot, 24a Willow Chase, Hazlemere, High Wycombe, Bucks, HP15 7QP","mode":"internal","products":["assisi","portofino","roma"]},
{"id":"09","name":"Elizabeth","address":None,"mode":"io","client_type":"Interior Designer","products":["portland","firenza","roma","assisi","portofino","miami"]},
{"id":"10","name":"Phil Aird-Mash","address":"20 The Mall, Surbiton, KT6 4EQ","mode":"io","products":["portland","firenza","roma","assisi","portofino","silver_nat"]},
{"id":"11","name":"Kerri Self","address":"Middlebridge House, Mill Lane, Longparish, Hampshire, SP11 6PN","mode":"internal","products":["portland","firenza","roma","assisi","portofino","silver_nat","silver_beige"]},
{"id":"12","name":"Jonathan Hemming","address":"Snappers Lane, St. Austell, PL26 7LH","mode":"internal","products":["roma","assisi","portofino"]},
{"id":"13","name":"Rob Reid","address":"Address to be confirmed","mode":"internal","products":["firenza","roma","assisi","miami","portofino","azure"]},
]

def get_asset(key, kind):
    p=PRODUCTS[key]; url=p["image" if kind=="image" else "life"]
    ext=".jpg" if ".jpg" in url.lower() or ".jpeg" in url.lower() else ".png"
    path=ASSET/f"{key}_{kind}{ext}"
    if path.exists() and path.stat().st_size>5000: return path
    r=requests.get(url,timeout=60,headers={"User-Agent":"Mozilla/5.0 InnerSpacePresentation/1.0"})
    r.raise_for_status()
    path.write_bytes(r.content)
    # normalize to RGB JPEG for predictable PDF embedding without altering colour/texture
    try:
        im=Image.open(path).convert("RGB")
        if max(im.size)>1800:
            im.thumbnail((1800,1800),Image.Resampling.LANCZOS)
        norm=ASSET/f"{key}_{kind}.jpg"
        im.save(norm,"JPEG",quality=94,subsampling=0)
        return norm
    except Exception:
        return path

def cover_crop(path, w, h):
    im=Image.open(path).convert("RGB")
    return ImageOps.fit(im,(int(w),int(h)),method=Image.Resampling.LANCZOS,centering=(0.5,0.5))

def draw_crop(c,path,x,y,w,h,soften=False):
    im=Image.open(path).convert("RGB")
    target=ImageOps.fit(im,(max(20,int(w*2.2)),max(20,int(h*2.2))),method=Image.Resampling.LANCZOS)
    if soften:
        target=ImageEnhance.Brightness(target).enhance(1.06)
        target=ImageEnhance.Contrast(target).enhance(0.92)
    bio=io.BytesIO(); target.save(bio,"JPEG",quality=92); bio.seek(0)
    c.drawImage(ImageReader(bio),x,y,w,h,mask='auto')

def spaced(c,text,x,y,size=7.2,font="Inter-Medium",spacing=2.2,color=GREY):
    c.setFont(font,size); c.setFillColor(color)
    c.setCharSpace(spacing)
    c.drawString(x,y,text.upper())
    c.setCharSpace(0)

def wrap_lines(text,font,size,maxw):
    words=text.split()
    lines=[]; cur=""
    for w in words:
        test=(cur+" "+w).strip()
        if pdfmetrics.stringWidth(test,font,size)<=maxw: cur=test
        else:
            if cur: lines.append(cur)
            cur=w
    if cur: lines.append(cur)
    return lines

def paragraph(c,text,x,y,maxw,font="Inter",size=9.4,leading=13,color=BLACK,max_lines=None):
    c.setFillColor(color); c.setFont(font,size)
    lines=wrap_lines(text,font,size,maxw)
    if max_lines: lines=lines[:max_lines]
    yy=y
    for ln in lines:
        c.drawString(x,yy,ln); yy-=leading
    return yy

def footer(c,client,section):
    c.setStrokeColor(HexColor("#ECEAE6")); c.setLineWidth(.35)
    c.line(M,H-806,W-M,H-806)
    spaced(c,f"{client['name']} material selection",M,29,5.8,"Inter-Medium",1.0,MID)
    spaced(c,f"{section} · Inner Space",W-M-150,29,5.8,"Inter-Medium",1.0,MID)

def cover_page(c,client):
    first=client["products"][0]
    img=get_asset(first,"image")
    draw_crop(c,img,0,0,W,H,soften=True)
    c.saveState(); c.setFillAlpha(.38); c.setFillColor(HexColor("#F3F0EA")); c.rect(0,0,W,H,fill=1,stroke=0); c.restoreState()
    panel_x=M; panel_y=88; panel_w=W-2*M; panel_h=142
    c.saveState(); c.setFillAlpha(.88); c.setFillColor(HexColor("#F7F5F1")); c.rect(panel_x,panel_y,panel_w,panel_h,fill=1,stroke=0); c.restoreState()
    spaced(c,"Inner Space",panel_x+18,panel_y+112,6.7,"Inter-Medium",2.4,BLACK)
    spaced(c,"Materials Selection",panel_x+18,panel_y+96,6.1,"Inter-Medium",1.7,BLACK)
    c.setFillColor(BLACK); c.setFont("Playfair",29); c.drawString(panel_x+18,panel_y+55,client["name"])
    meta=[]
    if client.get("client_type"): meta.append(client["client_type"])
    if client.get("address"): meta.append(client["address"])
    meta_txt=" · ".join(meta)
    if meta_txt: paragraph(c,meta_txt,panel_x+18,panel_y+30,panel_w-36,"Inter",7.8,10,GREY,max_lines=2)
    c.showPage()

def direction_page(c,client):
    spaced(c,"Project Direction",M,H-68,6.8,"Inter-Medium",2.3,GREY)
    c.setFont("Playfair",27); c.setFillColor(BLACK); c.drawString(M,H-110,"Project direction")
    if client["mode"]=="io":
        txt="A considered large-format flooring selection built around warm natural stone, quiet mineral tones and a continuous relationship between interior and exterior. Internal floors use the primary 120 x 120 cm format; coordinating 20 mm outdoor porcelain is shown in the largest verified format available within each collection."
        bullets=[("Large-format internal flooring","Primary 120 x 120 cm selection"),("Indoor / outdoor continuity","Verified 20 mm external formats"),("Natural mineral palette","Warm limestone, stone and soft neutrals"),("Material-led specification","Product identity and format verified")]
    else:
        txt="A considered internal large-format flooring selection focused on calm stone character, subtle tonal movement and architectural scale. All primary floor selections are presented in the verified 120 x 120 cm internal format, allowing the materials to be compared consistently across colour, texture and visual character."
        bullets=[("Large-format internal flooring","Primary 120 x 120 cm selection"),("Calm architectural scale","Low visual interruption across open areas"),("Natural mineral palette","Warm and cool stone options"),("Material-led specification","Product identity and format verified")]
    y=paragraph(c,txt,M,H-150,W-2*M,"Inter",9.3,13,BLACK)
    y-=13
    colw=(W-2*M-18)/2
    for i,(a,b) in enumerate(bullets):
        col=i%2; row=i//2; bx=M+col*(colw+18); by=y-row*39
        c.setStrokeColor(LINE); c.setLineWidth(.45); c.line(bx,by,bx+colw,by)
        c.setFont("Inter-Medium",7.8); c.setFillColor(BLACK); c.drawString(bx,by-14,a)
        c.setFont("Inter",6.8); c.setFillColor(GREY); c.drawString(bx,by-26,b)
    gy=H-595; gap=12; iw=(W-2*M-gap)/2; ih=132
    lifes=[get_asset(k,"life") for k in client["products"][:4]]
    while len(lifes)<4: lifes.append(get_asset(client["products"][len(lifes)%len(client["products"])],"life"))
    positions=[(M,gy+ih+gap),(M+iw+gap,gy+ih+gap),(M,gy),(M+iw+gap,gy)]
    for pth,(x,y0) in zip(lifes,positions): draw_crop(c,pth,x,y0,iw,ih)
    footer(c,client,"Project Direction"); c.showPage()

def product_page(c,client,key):
    p=PRODUCTS[key]
    spaced(c,"Product",M,H-68,6.8,"Inter-Medium",2.3,GREY)
    c.setFont("Playfair",25.5); c.setFillColor(BLACK); c.drawString(M,H-110,p["name"])
    gap=17; iw=(W-2*M-gap)/2; ih=255; iy=H-385
    draw_crop(c,get_asset(key,"image"),M,iy,iw,ih)
    draw_crop(c,get_asset(key,"life"),M+iw+gap,iy,iw,ih)
    spaced(c,"Why we selected it",M,iy-34,6.1,"Inter-Medium",1.8,GREY)
    rationale=p["short"]
    if client["mode"]=="io":
        if p.get("outdoor"):
            rationale += " The coordinating 20 mm option supports a considered transition to external areas while retaining the same material language."
        else:
            rationale += " The internal format provides the intended large-scale floor module."
    paragraph(c,rationale,M+142,iy-29,W-M-(M+142),"Inter",9.0,12.5,BLACK,max_lines=5)
    sy=iy-128
    if client["mode"]=="io":
        bw=(W-2*M-gap)/2
        for idx,(label,val) in enumerate([("INDOOR",p["internal"]),("OUTDOOR",p.get("outdoor") or "No verified 20 mm option shown")]):
            x=M+idx*(bw+gap)
            c.setStrokeColor(BLACK); c.setLineWidth(.65); c.line(x,sy,x+bw,sy)
            spaced(c,label,x,sy-18,6.0,"Inter-Bold",1.2,GREY)
            c.setFont("Inter",7.3); c.setFillColor(GREY); c.drawString(x,sy-31,val)
    else:
        c.setStrokeColor(BLACK); c.setLineWidth(.65); c.line(M,sy,W-M,sy)
        spaced(c,"INTERNAL FLOOR",M,sy-18,6.0,"Inter-Bold",1.2,GREY)
        c.setFont("Inter",7.5); c.setFillColor(GREY); c.drawString(M,sy-31,p["internal"])
    footer(c,client,"Product"); c.showPage()

def comparison_page(c,client):
    spaced(c,"Comparison & Next Steps",M,H-68,6.8,"Inter-Medium",2.0,GREY)
    c.setFont("Playfair",26); c.setFillColor(BLACK); c.drawString(M,H-110,"Compare the selection")
    y=H-156
    if client["mode"]=="io":
        cols=[M,M+120,M+266,M+390,W-M]
        headers=["PRODUCT","CHARACTER","INDOOR","OUTDOOR"]
    else:
        cols=[M,M+150,M+330,W-M]
        headers=["PRODUCT","CHARACTER","INTERNAL"]
    for i,h in enumerate(headers):
        spaced(c,h,cols[i]+4,y,5.5,"Inter-Bold",1.0,GREY)
    y-=15; c.setStrokeColor(LINE); c.line(M,y,W-M,y); y-=4
    rowh=39 if len(client["products"])<=6 else 34
    for key in client["products"]:
        p=PRODUCTS[key]
        c.setFillColor(BLACK); c.setFont("Inter-Medium",6.8)
        for j,ln in enumerate(wrap_lines(p["name"],"Inter-Medium",6.8,cols[1]-cols[0]-8)[:2]): c.drawString(cols[0]+4,y-12-j*8,ln)
        c.setFont("Inter",6.4); c.setFillColor(GREY)
        for j,ln in enumerate(wrap_lines(p["character"],"Inter",6.4,cols[2]-cols[1]-8)[:2]): c.drawString(cols[1]+4,y-12-j*8,ln)
        if client["mode"]=="io":
            for ci,val in [(2,p["internal"]),(3,p.get("outdoor") or "—")]:
                for j,ln in enumerate(wrap_lines(val,"Inter",6.2,cols[ci+1]-cols[ci]-8)[:2]): c.drawString(cols[ci]+4,y-12-j*8,ln)
        else:
            for j,ln in enumerate(wrap_lines(p["internal"],"Inter",6.2,cols[3]-cols[2]-8)[:2]): c.drawString(cols[2]+4,y-12-j*8,ln)
        y-=rowh; c.setStrokeColor(HexColor("#ECEAE6")); c.setLineWidth(.35); c.line(M,y,W-M,y)
    y-=22
    panel_h=106
    c.setFillColor(PALE); c.rect(M,y-panel_h,W-2*M,panel_h,fill=1,stroke=0)
    spaced(c,"Samples & next steps",M+20,y-28,6.0,"Inter-Medium",1.8,GREY)
    c.setFont("Playfair",18); c.setFillColor(BLACK); c.drawString(M+20,y-58,"Review the materials in your property")
    paragraph(c,"Review the physical samples in the intended light and against adjoining finishes. Once the preferred material is confirmed, Inner Space can finalise the project specification and quotation.",M+20,y-78,W-2*M-40,"Inter",7.4,10.5,GREY,max_lines=3)
    note_y=y-panel_h-34
    spaced(c,"Visualisation note",M,note_y,5.8,"Inter-Medium",1.6,GREY)
    paragraph(c,"Please be aware that lifestyle visualisations in this presentation are computer-generated or digitally presented to give a representation of the design concept. Colour, scale, texture and surface detail may vary from the physical tile. Final selections should always be confirmed against the supplied product sample.",M,note_y-16,W-2*M,"Inter",6.4,9,GREY,max_lines=4)
    c.setFont("Inter",5.8); c.setFillColor(MID)
    c.drawString(M,56,"Inner Space Tiles & Wood · 1354-1356 High Road, London N20 9HJ · info@innerspace.co.uk · innerspace.co.uk")
    footer(c,client,"Comparison & Next Steps"); c.showPage()

def make_pdf(client):
    safe=re.sub(r"[^A-Za-z0-9]+","-",client["name"]).strip("-")
    path=OUT/f"CLIENT-{client['id']}-{safe}-Material-Selection.pdf"
    c=canvas.Canvas(str(path),pagesize=(W,H),pageCompression=1)
    c.setTitle(f"Inner Space - {client['name']} Material Selection")
    c.setAuthor("Inner Space Tiles & Wood")
    cover_page(c,client); direction_page(c,client)
    for key in client["products"]: product_page(c,client,key)
    comparison_page(c,client)
    c.save()
    return path

# Preload and validate all required assets before creating any PDF.
needed=sorted({k for cl in CLIENTS for k in cl["products"]})
for key in needed:
    for kind in ("image","life"):
        p=get_asset(key,kind)
        im=Image.open(p); im.verify()
        if os.path.getsize(p)<5000: raise RuntimeError(f"Asset too small: {p}")

paths=[make_pdf(c) for c in CLIENTS]
print("Generated",len(paths),"PDFs")
for p in paths: print(p)
