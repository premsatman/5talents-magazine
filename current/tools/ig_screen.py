"""5Talents SCREEN Instagram carousel (1080x1350), our own artwork only."""
import numpy as np, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H=1080,1350
INK=(14,13,10); CREAM=(247,244,236); YEL=(253,226,10); GREY=(170,164,150); DARK=(20,19,14)
F="/tmp/fonts/"
BEB=lambda s: ImageFont.truetype(F+"BebasNeue.ttf",s)
MB=lambda s: ImageFont.truetype(F+"Montserrat-Bold.ttf",s)
M6=lambda s: ImageFont.truetype(F+"Montserrat-600.ttf",s)
M5=lambda s: ImageFont.truetype(F+"Montserrat-500.ttf",s)
SER="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"

def bg(seed=7, beam=True, yellow=False):
    if yellow:
        return Image.new("RGB",(W,H),YEL)
    rng=np.random.default_rng(seed)
    y,x=np.mgrid[0:H,0:W].astype(np.float32)
    img=np.zeros((H,W,3),np.float32); img[:]=(16,14,12)
    if beam:
        cx,cy=W*0.85,-H*0.3
        ang=np.arctan2(y-cy,x-cx); dist=np.hypot(x-cx,y-cy)
        cone=np.exp(-((ang-np.deg2rad(115))/0.17)**2)*np.clip(1-dist/(H*2.0),0,1)
        img+=cone[...,None]*np.array([120,100,70],np.float32)*0.85
        img+=((rng.random((H,W))>0.9985)*cone*255)[...,None]*0.6
    vx=(x-W/2)/(W/2); vy=(y-H/2)/(H/2)
    img*=np.clip(1-0.5*(vx**2+vy**2),0,1)[...,None]**1.3
    img+=rng.normal(0,7,(H,W,1))
    return Image.fromarray(np.clip(img,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))

def strip(d,y0,col=(8,7,6),hole=(46,42,36)):
    d.rectangle([0,y0,W,y0+40],fill=col)
    for i in range(0,W,52): d.rounded_rectangle([i+12,y0+11,i+36,y0+29],radius=4,fill=hole)

def tracked(d,x,y,t,f,fill,tr=4):
    for c in t: d.text((x,y),c,font=f,fill=fill); x+=d.textlength(c,font=f)+tr
    return x
def tw(d,t,f,tr=4): return sum(d.textlength(c,font=f)+tr for c in t)-tr

M=80
def header(d,fg):
    B=BEB(84); d.text((M,70),"5TALENTS",font=B,fill=fg)
    lab=MB(22); lw=tw(d,"SCREEN",lab); rx=W-M-lw
    lx=M+d.textlength("5TALENTS",font=B)+28
    d.line([(lx,114),(rx-28,114)],fill=fg,width=3); tracked(d,rx,101,"SCREEN",lab,fg)

def footer(d,n,fg,credit="Artwork: 5Talents"):
    f=M5(22); d.text((M,H-112),f"{n}/5",font=f,fill=fg)
    t="5talentsmag.com/screen"; d.text((W-M-d.textlength(t,font=f),H-112),t,font=f,fill=fg)

def para(d,x,y,text,f,fill,width,lh=1.38):
    for line in textwrap.wrap(text,width):
        d.text((x,y),line,font=f,fill=fill); y+=int(f.size*lh)
    return y

def big(d,x,y,lines,size,cols):
    f=BEB(size)
    for l,c in zip(lines,cols):
        d.text((x,y),l,font=f,fill=c); y+=int(size*0.93)
    return y

def s1():
    im=bg(); d=ImageDraw.Draw(im); strip(d,0); strip(d,H-40); header(d,CREAM)
    tracked(d,M+4,300,"NETFLIX DOCUSERIES  ·  3 EPISODES",MB(24),YEL)
    y=big(d,M,350,["HUSBAND.","BOSS.","PASTOR."],250,[CREAM,CREAM,YEL])
    y=para(d,M,y+30,"One man held every key in Mica Miller's life. Here's why churches are talking.",M6(36),CREAM,40)
    f=MB(28); t="Swipe"; ax=W-M-50; tx=ax-16-d.textlength(t,font=f); d.text((tx,H-172),t,font=f,fill=YEL)
    yy=H-155; d.line([(ax,yy),(ax+48,yy)],fill=YEL,width=4); d.polygon([(ax+50,yy),(ax+36,yy-10),(ax+36,yy+10)],fill=YEL)
    footer(d,1,GREY); return im

def s2():
    im=bg(seed=11); d=ImageDraw.Draw(im); strip(d,0); strip(d,H-40); header(d,CREAM)
    y=big(d,M,290,["WHO WAS","MICA MILLER?"],150,[YEL,YEL])
    y=para(d,M,y+40,"A 30-year-old worship leader at Solid Rock Church in Myrtle Beach, South Carolina.",M5(38),CREAM,38)
    y=para(d,M,y+30,"She married the church's pastor. She worked for the church. By 2024 she was trying to leave. She died in April 2024.",M5(38),CREAM,38)
    tracked(d,M,y+50,"STREAMING NOW ON NETFLIX",MB(24),YEL)
    footer(d,2,GREY); return im

def s3():
    im=bg(yellow=True); d=ImageDraw.Draw(im); header(d,INK)
    rows=[("LATE 2024","Solid Rock Church closes after protests"),
          ("DEC 2025","Her husband is indicted on federal cyberstalking and false-statement charges"),
          ("JAN 2026","He pleads not guilty and denies it all"),
          ("26 AUG 2026","The Netflix series drops")]
    y=270
    for a,b in rows:
        d.text((M,y),a,font=BEB(110),fill=INK); y+=112
        y=para(d,M,y,b,M6(34),INK,44,1.3)+44
    d.text((M,y+4),"The charges have not been proven in court.",font=M5(28),fill=INK)
    footer(d,3,INK); return im

def s4():
    im=bg(seed=19,beam=True); d=ImageDraw.Draw(im); strip(d,0); strip(d,H-40); header(d,CREAM)
    q=ImageFont.truetype(SER,64)
    y=para(d,M,340,"“Neither as being lords over God’s heritage, but being ensamples to the flock.”",q,CREAM,24,1.3)
    tracked(d,M,y+30,"1 PETER 5:3 (KJV)",MB(26),YEL)
    para(d,M,y+130,"A pastor nobody can say no to isn't what the Bible calls a leader.",M5(38),CREAM,38)
    footer(d,4,GREY); return im

def s5():
    im=bg(seed=23); d=ImageDraw.Draw(im); strip(d,0); strip(d,H-40); header(d,CREAM)
    y=big(d,M,270,["COULD ANYONE","IN YOUR CHURCH","SAY NO TO","YOUR PASTOR?"],150,[CREAM,CREAM,CREAM,YEL])
    y=para(d,M,y+30,"Tell us in the comments. Send this to someone on your church team.",MB(34),CREAM,44)
    para(d,M,y+40,"Struggling or afraid? India: Tele-MANAS 14416  ·  US: call or text 988. Tell someone you trust.",M5(25),GREY,62)
    footer(d,5,GREY); return im

for i,fn in enumerate([s1,s2,s3,s4,s5],1): fn().convert("RGB").save(f"/tmp/ig/slide-{i}.jpg",quality=92)
ims=[Image.open(f"/tmp/ig/slide-{i}.jpg") for i in range(1,6)]
p=Image.new("RGB",(5*W+4*30,H),(240,240,240))
for i,im in enumerate(ims): p.paste(im,(i*(W+30),0))
p.resize((p.width//3,p.height//3)).save("/tmp/ig/preview.png")
