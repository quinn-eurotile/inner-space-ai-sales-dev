from . import design_tokens as T
from .text_layout import draw_wrapped,wrap_lines,tracked_width,LayoutError

def draw_tracked(c,text,x,y,style,color,manifest,page,role):
    t=c.beginText(); t.setTextOrigin(x,y); t.setFont(style.font,style.size); t.setFillColor(color); t.setCharSpace(style.tracking)
    out=text.upper() if style.uppercase else text; t.textOut(out); c.drawText(t)
    w=tracked_width(out,style.font,style.size,style.tracking)
    manifest.add_text(page,role,T.Box(x,y-style.size*.3,w,style.leading),style,out,style.leading)

def draw_footer(c,job,section,manifest,page):
    c.setStrokeColor(T.LINE); c.setLineWidth(.35); c.line(T.MARGIN_X,T.FOOTER_RULE_Y,T.PAGE_W-T.MARGIN_X,T.FOOTER_RULE_Y)
    draw_tracked(c,f"{job['name']} material selection",T.MARGIN_X,T.FOOTER_TEXT_Y,T.TYPE['footer'],T.MID,manifest,page,'footer_left')
    draw_tracked(c,f"{section} · Inner Space",T.PAGE_W-T.MARGIN_X-150,T.FOOTER_TEXT_Y,T.TYPE['footer'],T.MID,manifest,page,'footer_right')

def cover_page(c,job,products,assets,manifest,page):
    hero_key=job.get('cover_hero_product') or job['products'][0]
    hero=assets.get(hero_key,'life')
    assets.draw_crop(c,hero,0,0,T.PAGE_W,T.PAGE_H); manifest.add_box(page,'image','cover_hero',T.Box(0,0,T.PAGE_W,T.PAGE_H))
    steps=16
    for i in range(steps):
        alpha=.58*(1-i/(steps-1)); c.saveState(); c.setFillAlpha(alpha); c.setFillColor(T.BLACK)
        h=T.COVER_GRADIENT_H/steps; c.rect(0,i*h,T.PAGE_W,h+1,fill=1,stroke=0); c.restoreState()
    x=T.COVER_TEXT_X; y=T.COVER_TEXT_BOTTOM
    draw_tracked(c,'Inner Space',x,y+115,T.TYPE['cover_brand'],T.WHITE,manifest,page,'cover_brand')
    draw_tracked(c,'Material Selection',x,y+98,T.TYPE['cover_kicker'],T.WHITE,manifest,page,'cover_kicker')
    st=T.TYPE['cover_title']; c.setFillColor(T.WHITE); c.setFont(st.font,st.size); c.drawString(x,y+52,job['name'])
    manifest.add_text(page,'cover_title',T.Box(x,y+44,T.COVER_TEXT_W,40),st,job['name'],st.leading)
    desc=' · '.join([p for p in (job.get('client_type'),job.get('address')) if p])
    if desc: draw_wrapped(c,desc,T.Box(x,y+4,T.COVER_TEXT_W,32),T.TYPE['body_small'],T.WHITE,manifest,'body_cover_descriptor',page)
    c.showPage()

def project_direction_page(c,job,products,assets,manifest,page):
    draw_tracked(c,'Project Direction',T.MARGIN_X,T.PAGE_H-68,T.TYPE['eyebrow'],T.GREY,manifest,page,'eyebrow')
    st=T.TYPE['page_title']; c.setFont(st.font,st.size); c.setFillColor(T.BLACK); c.drawString(T.MARGIN_X,T.PAGE_H-110,'Project direction')
    manifest.add_text(page,'page_title',T.Box(T.MARGIN_X,T.PAGE_H-120,T.CONTENT_W,34),st,'Project direction',34)
    if job['mode']=='io':
        txt='A considered large-format flooring selection built around warm natural stone, quiet mineral tones and a continuous relationship between interior and exterior. Internal floors use the primary 120 x 120 cm format; coordinating 20 mm outdoor porcelain is shown in the largest verified format available within each collection.'
        bullets=[('Large-format internal flooring','Primary 120 x 120 cm selection'),('Indoor / outdoor continuity','Verified 20 mm external formats'),('Natural mineral palette','Warm limestone, stone and soft neutrals'),('Material-led specification','Product identity and format verified')]
    else:
        txt='A considered internal large-format flooring selection focused on calm stone character, subtle tonal movement and architectural scale. All primary floor selections are presented in the verified 120 x 120 cm internal format, allowing the materials to be compared consistently across colour, texture and visual character.'
        bullets=[('Large-format internal flooring','Primary 120 x 120 cm selection'),('Calm architectural scale','Low visual interruption across open areas'),('Natural mineral palette','Warm and cool stone options'),('Material-led specification','Product identity and format verified')]
    draw_wrapped(c,txt,T.Box(T.MARGIN_X,T.PAGE_H-210,T.CONTENT_W,72),T.TYPE['body'],T.BLACK,manifest,'body_project_direction',page)
    colw=(T.CONTENT_W-18)/2; y=T.PAGE_H-231
    for i,(a,b) in enumerate(bullets):
        col=i%2; row=i//2; bx=T.MARGIN_X+col*(colw+18); by=y-row*39
        c.setStrokeColor(T.LINE); c.setLineWidth(.45); c.line(bx,by,bx+colw,by)
        c.setFont('Inter-Medium',7.8); c.setFillColor(T.BLACK); c.drawString(bx,by-14,a)
        c.setFont('Inter',6.8); c.setFillColor(T.GREY); c.drawString(bx,by-26,b)
    lifes=[assets.get(k,'life') for k in job['products'][:4]]
    while len(lifes)<4: lifes.append(assets.get(job['products'][len(lifes)%len(job['products'])],'life'))
    pos=[(T.MARGIN_X,T.DIRECTION_IMAGE_BASE_Y+T.DIRECTION_IMAGE_H+T.DIRECTION_IMAGE_GAP),(T.MARGIN_X+T.DIRECTION_IMAGE_W+T.DIRECTION_IMAGE_GAP,T.DIRECTION_IMAGE_BASE_Y+T.DIRECTION_IMAGE_H+T.DIRECTION_IMAGE_GAP),(T.MARGIN_X,T.DIRECTION_IMAGE_BASE_Y),(T.MARGIN_X+T.DIRECTION_IMAGE_W+T.DIRECTION_IMAGE_GAP,T.DIRECTION_IMAGE_BASE_Y)]
    for idx,(pth,(x,y0)) in enumerate(zip(lifes,pos)):
        assets.draw_crop(c,pth,x,y0,T.DIRECTION_IMAGE_W,T.DIRECTION_IMAGE_H); manifest.add_box(page,'image',f'direction_image_{idx+1}',T.Box(x,y0,T.DIRECTION_IMAGE_W,T.DIRECTION_IMAGE_H))
    draw_footer(c,job,'Project Direction',manifest,page); c.showPage()

def product_page(c,job,key,products,assets,manifest,page):
    p=products[key]; draw_tracked(c,'Product',T.MARGIN_X,T.PAGE_H-68,T.TYPE['eyebrow'],T.GREY,manifest,page,'eyebrow')
    st=T.TYPE['product_title']; title_lines=wrap_lines(p['name'],st.font,st.size,T.CONTENT_W)
    if len(title_lines)>2: raise LayoutError(f"{p['name']}: product title exceeds two lines")
    c.setFillColor(T.BLACK); c.setFont(st.font,st.size); ty=T.PAGE_H-110
    for ln in title_lines: c.drawString(T.MARGIN_X,ty,ln); ty-=st.leading
    manifest.add_text(page,'product_title',T.Box(T.MARGIN_X,T.PAGE_H-145,T.CONTENT_W,65),st,p['name'],len(title_lines)*st.leading)
    for role,box,kind in [('product_authoritative',T.PRODUCT_LEFT_BOX,'image'),('product_lifestyle',T.PRODUCT_RIGHT_BOX,'life')]:
        assets.draw_crop(c,assets.get(key,kind),box.x,box.y,box.w,box.h); manifest.add_box(page,'image',role,box)
    # Keep the tracked label and untracked body as separate semantic regions.
    # Geometry is unchanged from the approved grid: the label occupies the
    # fixed left column and the body ends exactly at the established safe margin.
    rationale_label='Why we selected it'
    label_style=T.TYPE['spec_label']
    body_x=T.PRODUCT_RATIONALE_BOX.x
    safe_right=T.PAGE_W-T.MARGIN_X
    label_right=body_x-T.GUTTER
    label_col_w=label_right-T.MARGIN_X
    label_render_w=tracked_width(rationale_label.upper(),label_style.font,label_style.size,label_style.tracking)
    if label_render_w>label_col_w+0.01:
        raise LayoutError(f'rationale label exceeds fixed label column: {label_render_w:.1f}pt > {label_col_w:.1f}pt')
    draw_tracked(c,rationale_label,T.MARGIN_X,T.PRODUCT_RATIONALE_LABEL_Y,label_style,T.GREY,manifest,page,'rationale_label')
    rationale=p['short']
    if job['mode']=='io': rationale+=(' The coordinating 20 mm option supports a considered transition to external areas while retaining the same material language.' if p.get('outdoor') else ' The internal format provides the intended large-scale floor module.')
    rationale_body_box=T.Box(body_x,T.PRODUCT_RATIONALE_BOX.y,safe_right-body_x,T.PRODUCT_RATIONALE_BOX.h)
    draw_wrapped(c,rationale,rationale_body_box,T.TYPE['body'],T.BLACK,manifest,'body_rationale',page)
    sy=T.PRODUCT_SPEC_RULE_Y
    if job['mode']=='io':
        for idx,(label,val) in enumerate([('INDOOR',p['internal']),('OUTDOOR',p.get('outdoor') or 'No verified 20 mm option shown')]):
            x=T.MARGIN_X+idx*(T.TWO_COL_W+T.GUTTER); c.setStrokeColor(T.BLACK); c.setLineWidth(.65); c.line(x,sy,x+T.TWO_COL_W,sy)
            draw_tracked(c,label,x,sy-18,T.TYPE['spec_label'],T.GREY,manifest,page,f'spec_label_{label.lower()}')
            draw_wrapped(c,val,T.Box(x,sy-49,T.TWO_COL_W,18),T.TYPE['spec_value'],T.GREY,manifest,f'spec_value_{label.lower()}',page)
    else:
        c.setStrokeColor(T.BLACK); c.setLineWidth(.65); c.line(T.MARGIN_X,sy,T.PAGE_W-T.MARGIN_X,sy)
        draw_tracked(c,'INTERNAL FLOOR',T.MARGIN_X,sy-18,T.TYPE['spec_label'],T.GREY,manifest,page,'spec_label_internal')
        draw_wrapped(c,p['internal'],T.Box(T.MARGIN_X,sy-49,T.CONTENT_W,18),T.TYPE['spec_value'],T.GREY,manifest,'spec_value_internal',page)
    draw_footer(c,job,'Product',manifest,page); c.showPage()

def room_specification_page(c,job,room,products,assets,manifest,page):
    draw_tracked(c,room.get('eyebrow','Room Specification'),T.MARGIN_X,T.PAGE_H-68,T.TYPE['eyebrow'],T.GREY,manifest,page,'eyebrow')
    st=T.TYPE['page_title']; title=room['title']; c.setFont(st.font,st.size); c.setFillColor(T.BLACK); c.drawString(T.MARGIN_X,T.PAGE_H-110,title)
    manifest.add_text(page,'page_title',T.Box(T.MARGIN_X,T.PAGE_H-122,T.CONTENT_W,36),st,title,36)
    draw_wrapped(c,room['rationale'],T.Box(T.MARGIN_X,T.PAGE_H-220,T.CONTENT_W,70),T.TYPE['body'],T.BLACK,manifest,'body_room_rationale',page)
    draw_footer(c,job,room.get('footer','Room Specification'),manifest,page); c.showPage()

def _table_layout(job):
    if job['mode']=='io':
        return [118,142,123,T.CONTENT_W-383],['PRODUCT','CHARACTER','INDOOR','OUTDOOR'],[lambda p:p['name'],lambda p:p['character'],lambda p:p['internal'],lambda p:p.get('outdoor') or '—']
    return [145,177,T.CONTENT_W-322],['PRODUCT','CHARACTER','INTERNAL'],[lambda p:p['name'],lambda p:p['character'],lambda p:p['internal']]

def comparison_page(c,job,products,assets,manifest,page):
    draw_tracked(c,'Comparison & Next Steps',T.MARGIN_X,T.PAGE_H-68,T.TYPE['eyebrow'],T.GREY,manifest,page,'eyebrow')
    st=T.TYPE['page_title']; c.setFont(st.font,st.size); c.setFillColor(T.BLACK); c.drawString(T.MARGIN_X,T.PAGE_H-110,'Compare the selection')
    manifest.add_text(page,'page_title',T.Box(T.MARGIN_X,T.PAGE_H-122,T.CONTENT_W,36),st,'Compare the selection',36)
    widths,headers,getters=_table_layout(job); xs=[T.MARGIN_X]
    for w in widths[:-1]: xs.append(xs[-1]+w)
    y=T.TABLE_TOP_Y
    for i,h in enumerate(headers): draw_tracked(c,h,xs[i]+T.TABLE_CELL_PAD_X,y,T.TYPE['table_header'],T.GREY,manifest,page,f'table_header_{i}')
    y-=15; c.setStrokeColor(T.LINE); c.line(T.MARGIN_X,y,T.PAGE_W-T.MARGIN_X,y)
    for ridx,key in enumerate(job['products']):
        p=products[key]; cells=[g(p) for g in getters]; packs=[]; req=[]
        for ci,text in enumerate(cells):
            style=T.TYPE['table_product'] if ci==0 else T.TYPE['table_body']; maxw=widths[ci]-2*T.TABLE_CELL_PAD_X
            lines=wrap_lines(text,style.font,style.size,maxw); packs.append((style,lines,text)); req.append(len(lines)*style.leading+2*T.TABLE_CELL_PAD_Y)
        rh=max(T.TABLE_ROW_MIN_H,max(req)); y-=rh
        if y<T.TABLE_BOTTOM_LIMIT: raise LayoutError(f'comparison table exceeds reserved area on row {ridx+1}')
        for ci,(style,lines,text) in enumerate(packs):
            box=T.Box(xs[ci]+T.TABLE_CELL_PAD_X,y+T.TABLE_CELL_PAD_Y,widths[ci]-2*T.TABLE_CELL_PAD_X,rh-2*T.TABLE_CELL_PAD_Y)
            c.setFillColor(T.BLACK if ci==0 else T.GREY); c.setFont(style.font,style.size); yy=y+rh-T.TABLE_CELL_PAD_Y-style.size
            for line in lines: c.drawString(box.x,yy,line); yy-=style.leading
            manifest.add_text(page,'table_product' if ci==0 else 'table_body',box,style,text,len(lines)*style.leading)
        c.setStrokeColor(T.LINE); c.setLineWidth(.35); c.line(T.MARGIN_X,y,T.PAGE_W-T.MARGIN_X,y)
    y-=22; panel_h=106
    if y-panel_h<98: raise LayoutError('comparison next-steps panel would collide with footer')
    c.setFillColor(T.PALE); c.rect(T.MARGIN_X,y-panel_h,T.CONTENT_W,panel_h,fill=1,stroke=0); manifest.add_box(page,'panel','next_steps',T.Box(T.MARGIN_X,y-panel_h,T.CONTENT_W,panel_h))
    draw_tracked(c,'Next steps',T.MARGIN_X+20,y-28,T.TYPE['spec_label'],T.GREY,manifest,page,'next_steps_label')
    c.setFont('Playfair',18); c.setFillColor(T.BLACK); c.drawString(T.MARGIN_X+20,y-58,'Review your material selection')
    draw_wrapped(c,'Review the selected materials and consider which option best suits your project. For further information, samples, availability or project-specific pricing, please contact your Inner Space Project Specifier, who can assist with the next stage of your project.',T.Box(T.MARGIN_X+20,y-103,T.CONTENT_W-40,34),T.TYPE['body_small'],T.GREY,manifest,'body_next_steps',page)
    note_y=y-panel_h-34; draw_tracked(c,'Visualisation note',T.MARGIN_X,note_y,T.TYPE['spec_label'],T.GREY,manifest,page,'visualisation_note_label')
    draw_wrapped(c,'Please be aware that lifestyle visualisations in this presentation are computer-generated or digitally presented to give a representation of the design concept. Colour, scale, texture and surface detail may vary from the physical tile. Final selections should always be confirmed against the supplied product sample.',T.Box(T.MARGIN_X,note_y-52,T.CONTENT_W,40),T.TYPE['body_small'],T.GREY,manifest,'body_visualisation_note',page)
    c.setFont('Inter',5.8); c.setFillColor(T.MID); c.drawString(T.MARGIN_X,56,'Inner Space Tiles & Wood · 1354-1356 High Road, London N20 9HJ · info@innerspace.co.uk · innerspace.co.uk')
    draw_footer(c,job,'Comparison & Next Steps',manifest,page); c.showPage()

def technical_summary_page(c,job,rows,manifest,page):
    draw_tracked(c,'Technical Summary',T.MARGIN_X,T.PAGE_H-68,T.TYPE['eyebrow'],T.GREY,manifest,page,'eyebrow')
    st=T.TYPE['page_title']; c.setFont(st.font,st.size); c.setFillColor(T.BLACK); c.drawString(T.MARGIN_X,T.PAGE_H-110,'Material schedule')
    manifest.add_text(page,'page_title',T.Box(T.MARGIN_X,T.PAGE_H-122,T.CONTENT_W,36),st,'Material schedule',36)
    y=T.PAGE_H-155
    for idx,row in enumerate(rows):
        txt=' · '.join(str(v) for v in row if v); draw_wrapped(c,txt,T.Box(T.MARGIN_X,y-28,T.CONTENT_W,24),T.TYPE['body_small'],T.BLACK,manifest,f'body_summary_{idx}',page); y-=32
    draw_footer(c,job,'Technical Summary',manifest,page); c.showPage()
