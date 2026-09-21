from reportlab.pdfbase import pdfmetrics

class LayoutError(RuntimeError): pass

def tracked_width(text,font,size,tracking=0.0):
    return pdfmetrics.stringWidth(text,font,size)+max(0,len(text)-1)*tracking

def split_long_token(token,font,size,maxw):
    pieces=[]; cur=''
    for ch in token:
        test=cur+ch
        if pdfmetrics.stringWidth(test,font,size)<=maxw: cur=test
        else:
            if cur: pieces.append(cur)
            cur=ch
    if cur: pieces.append(cur)
    return pieces

def wrap_lines(text,font,size,maxw):
    words=text.split(); lines=[]; cur=''
    for word in words:
        if pdfmetrics.stringWidth(word,font,size)>maxw:
            if cur: lines.append(cur); cur=''
            lines.extend(split_long_token(word,font,size,maxw)); continue
        test=(cur+' '+word).strip()
        if pdfmetrics.stringWidth(test,font,size)<=maxw: cur=test
        else:
            if cur: lines.append(cur)
            cur=word
    if cur: lines.append(cur)
    return lines

def required_text_height(text,font,size,leading,maxw):
    lines=wrap_lines(text,font,size,maxw)
    return max(leading,len(lines)*leading),lines

def draw_wrapped(canvas,text,box,style,color,manifest,role,page_index):
    if style.tracking!=0: raise LayoutError(f'{role}: wrapped/body text cannot use tracking {style.tracking}')
    h,lines=required_text_height(text,style.font,style.size,style.leading,box.w)
    if h>box.h+0.01: raise LayoutError(f'{role}: text needs {h:.1f}pt but box allows {box.h:.1f}pt')
    # ReportLab/PDF text-state parameters such as Tc (character spacing) persist
    # across BT/ET blocks. Body text must therefore explicitly reset typography
    # after a tracked label rather than relying on canvas.drawString defaults.
    y=box.y+box.h-style.size
    t=canvas.beginText()
    t.setTextOrigin(box.x,y)
    t.setFont(style.font,style.size)
    t.setFillColor(color)
    t.setCharSpace(0)
    t.setHorizScale(100)
    t.setLeading(style.leading)
    for line in lines:
        t.textLine(line)
    canvas.drawText(t)
    manifest.add_text(page_index,role,box,style,text,h)
    return len(lines)
