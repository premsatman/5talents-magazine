"""5Talents Screen card: cinematic, our own artwork, no studio imagery.
Usage: python3 screen_card.py "LINE ONE" "LINE TWO" "KEYWORD" "kicker text" out.png
The KEYWORD (a word in the lines) is set in yellow."""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H=1600,900
INK=(14,13,10); CREAM=(247,244,236); YEL=(253,226,10); GREY=(170,164,150)
F="/tmp/fonts/"
BEB=lambda s: ImageFont.truetype(F+"BebasNeue.ttf",s)
MB=lambda s: ImageFont.truetype(F+"Montserrat-Bold.ttf",s)
M5=lambda s: ImageFont.truetype(F+"Montserrat-500.ttf",s)

def background(seed=7):
    rng=np.random.default_rng(seed)
    y,x=np.mgrid[0:H,0:W].astype(np.float32)
    # base: deep warm charcoal
    img=np.zeros((H,W,3),np.float32); img[:]=(16,14,12)
    # projector beam from top-right, soft cone
    cx,cy=W*0.78,-H*0.35
    ang=np.arctan2(y-cy,x-cx); dist=np.hypot(x-cx,y-cy)
    cone=np.exp(-((ang-np.deg2rad(112))/0.16)**2)*np.clip(1-dist/(H*2.2),0,1)
    img+=cone[...,None]*np.array([120,100,70],np.float32)*0.95
    # dust in the beam
    dust=(rng.random((H,W))>0.9985).astype(np.float32)*cone*255
    img+=dust[...,None]*0.6
    # vignette
    vx=(x-W/2)/(W/2); vy=(y-H/2)/(H/2); v=np.clip(1-0.55*(vx**2+vy**2),0,1)
    img*=v[...,None]**1.3
    # film grain
    img+=rng.normal(0,7,(H,W,1))
    im=Image.fromarray(np.clip(img,0,255).astype(np.uint8))
    return im.filter(ImageFilter.GaussianBlur(0.6))

def filmstrip(d,top):
    # 35mm-style perforations in a thin band
    band_h=46; y0=top
    d.rectangle([0,y0,W,y0+band_h],fill=(8,7,6))
    for i in range(0,W,58):
        d.rounded_rectangle([i+14,y0+13,i+40,y0+33],radius=4,fill=(46,42,36))

def tracked(d,x,y,t,f,fill,tr=5):
    for c in t: d.text((x,y),c,font=f,fill=fill); x+=d.textlength(c,font=f)+tr
    return x
def tw(d,t,f,tr=5): return sum(d.textlength(c,font=f)+tr for c in t)-tr

def make(lines,keyword,kicker,out,label="SCREEN",tag=None):
    im=background(); d=ImageDraw.Draw(im)
    filmstrip(d,0); filmstrip(d,H-46)
    M=110
    # header: 5TALENTS — line — SCREEN
    B=BEB(100); d.text((M,78),"5TALENTS",font=B,fill=CREAM)
    lx=M+d.textlength("5TALENTS",font=B)+34; lab=MB(26); lw=tw(d,label,lab); rx=W-M-lw
    d.line([(lx,130),(rx-36,130)],fill=CREAM,width=3); tracked(d,rx,114,label,lab,CREAM)
    # big line(s), Bebas, keyword in yellow
    size=210 if max(len(l) for l in lines)<=18 else 170
    f=BEB(size); y=250
    if tag:
        tf=MB(22); tracked(d,M+4,222,tag,tf,YEL,tr=4); y=262
    for l in lines:
        x=M
        for i,word in enumerate(l.split(' ')):
            col=YEL if word.strip('.,!?').upper()==keyword.strip('.,!?').upper() else CREAM
            d.text((x,y),word,font=f,fill=col)
            x+=d.textlength(word+' ',font=f)
        y+=int(size*0.92)
    # kicker
    k=M5(34); d.text((M,H-150),kicker,font=k,fill=GREY)
    im.save(out); return out

if __name__=="__main__":
    a=sys.argv[1:]
    lines=[s for s in a[0].split('|')]
    make(lines,a[1],a[2],a[3],tag=a[4] if len(a)>4 else None)
