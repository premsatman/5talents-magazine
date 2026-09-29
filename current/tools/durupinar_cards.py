import numpy as np, textwrap, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

INK=(14,13,10); CREAM=(247,244,236); YEL=(253,226,10); GREY=(170,164,150)
F="/tmp/fonts/"
BEB=lambda s: ImageFont.truetype(F+"BebasNeue.ttf",s)
MB =lambda s: ImageFont.truetype(F+"Montserrat-Bold.ttf",s)
M6 =lambda s: ImageFont.truetype(F+"Montserrat-600.ttf",s)
M5 =lambda s: ImageFont.truetype(F+"Montserrat-500.ttf",s)
SER="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"
OUT="/tmp/ark/out/"

def bg(W,H,seed=7,beam=True,yellow=False):
    if yellow: return Image.new("RGB",(W,H),YEL)
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

def strip(d,y0,W,col=(8,7,6),hole=(46,42,36)):
    d.rectangle([0,y0,W,y0+40],fill=col)
    for i in range(0,W,52): d.rounded_rectangle([i+12,y0+11,i+36,y0+29],radius=4,fill=hole)

def tracked(d,x,y,t,f,fill,tr=4):
    for c in t: d.text((x,y),c,font=f,fill=fill); x+=d.textlength(c,font=f)+tr
    return x
def tw(d,t,f,tr=4): return sum(d.textlength(c,font=f)+tr for c in t)-tr

def head(d,W,M,fg,label="CURRENT",bs=84,ty=70,ly=114):
    B=BEB(bs); d.text((M,ty),"5TALENTS",font=B,fill=fg)
    lab=MB(22); lw=tw(d,label,lab); rx=W-M-lw
    lx=M+d.textlength("5TALENTS",font=B)+28
    d.line([(lx,ly),(rx-28,ly)],fill=fg,width=3); tracked(d,rx,ly-13,label,lab,fg)

def para(d,x,y,text,f,fill,width,lh=1.38):
    for line in textwrap.wrap(text,width):
        d.text((x,y),line,font=f,fill=fill); y+=int(f.size*lh)
    return y

def big(d,x,y,lines,size,cols):
    f=BEB(size)
    for l,c in zip(lines,cols): d.text((x,y),l,font=f,fill=c); y+=int(size*0.93)
    return y

# ---------------- HERO 1600x900 ----------------
def hero():
    W,H,M=1600,900,96
    im=bg(W,H,seed=5); d=ImageDraw.Draw(im)
    head(d,W,M,CREAM,bs=72,ty=64,ly=100)
    tracked(d,M+4,300,"NOAH'S ARK  ·  DURUPINAR, EASTERN TURKEY",MB(24),YEL)
    y=big(d,M,352,["THEY HAVEN'T","FOUND IT YET."],178,[CREAM,YEL])
    para(d,M,y+26,"What went viral this week, and what the team holding the drill actually said.",M6(34),CREAM,64)
    im.convert("RGB").save(OUT+"hero.jpg",quality=93)

# ---------------- CAROUSEL 1080x1350 ----------------
W,H,M=1080,1350,80
N=6
def foot(d,n,fg):
    f=M5(22); d.text((M,H-112),f"{n}/{N}",font=f,fill=fg)
    t="5talentsmag.com/current"; d.text((W-M-d.textlength(t,font=f),H-112),t,font=f,fill=fg)

def base(seed,yellow=False):
    im=bg(W,H,seed=seed,yellow=yellow); d=ImageDraw.Draw(im)
    head(d,W,M,INK if yellow else CREAM)
    return im,d

def s1():
    im,d=base(5)
    tracked(d,M+4,250,"NOAH'S ARK  \u00b7  WHAT ACTUALLY HAPPENED",MB(23),YEL)
    y=big(d,M,300,["YOUR FEED","SAYS THEY","FOUND IT."],142,[CREAM,CREAM,YEL])
    para(d,M,y+30,"The team digging there says: not yet. Here is the week, in order.",M6(34),CREAM,44)
    f=MB(28); ax=W-M-50; t="Swipe"
    d.text((ax-16-d.textlength(t,font=f),H-172),t,font=f,fill=YEL)
    yy=H-155; d.line([(ax,yy),(ax+48,yy)],fill=YEL,width=4)
    d.polygon([(ax+50,yy),(ax+36,yy-10),(ax+36,yy+10)],fill=YEL)
    foot(d,1,GREY); im.convert("RGB").save(OUT+"slide-1.jpg",quality=92)

def s2():
    im,d=base(9)
    tracked(d,M+4,250,"WHY IT'S EVERYWHERE",MB(24),YEL)
    y=big(d,M,300,["BEAR GRYLLS","WENT."],132,[CREAM,YEL])
    y=para(d,M,y+26,"The team's post about his visit is sitting on 791,000 likes. He is credited on it as a collaborator, so the visit is real.",M5(32),CREAM,50)
    para(d,M,y+26,"He did not confirm anything about the ridge. The caption says he agrees Noah was the original survivalist.",MB(30),YEL,52)
    foot(d,2,GREY); im.convert("RGB").save(OUT+"slide-2.jpg",quality=92)

def s3():
    im,d=base(13)
    tracked(d,M+4,250,"THEN THE FEED TOOK OVER",MB(24),YEL)
    y=big(d,M,300,["16,700 LIKES.","ONE PROBLEM."],132,[CREAM,YEL])
    y=para(d,M,y+26,"A separate account claimed soil samples had exposed ancient marine life and artifacts \u201cdating perfectly to the era of the great flood.\u201d",M5(32),CREAM,50)
    para(d,M,y+26,"Instagram labels that account an AI-generated profile.",MB(31),YEL,50)
    foot(d,3,GREY); im.convert("RGB").save(OUT+"slide-3.jpg",quality=92)

def s4():
    im,d=base(0,yellow=True)
    tracked(d,M+4,250,"WHAT THE TEAM ACTUALLY SAID",MB(24),INK)
    q=ImageFont.truetype(SER,52)
    y=para(d,M,330,"\u201cWe have not identified any material as ancient wood or established its age.\u201d",q,INK,30,1.3)
    tracked(d,M,y+20,"ANDREW JONES, NOAH'S ARK SCANS",MB(23),INK)
    para(d,M,y+92,"Speaking to Newsweek on 28 September. The lab results are still pending. A hard layer four or five metres down broke their drill bit. It might be petrified wood. It might be rock.",M5(31),INK,50)
    foot(d,4,INK); im.convert("RGB").save(OUT+"slide-4.jpg",quality=92)

def s5():
    im,d=base(21)
    tracked(d,M+4,250,"AN ARCHAEOLOGIST WHO BELIEVES THE BIBLE",MB(22),YEL)
    y=big(d,M,300,["GOOD THEOLOGY","DOES NOT NEED","BAD ARCHAEOLOGY."],104,[CREAM,CREAM,YEL])
    tracked(d,M,y+24,"DR AARON JUDKINS",MB(23),GREY)
    para(d,M,y+96,"He led a 2013 expedition to Mount Ararat and helped produce the documentary Finding Noah. He called the \u201c100% confirmed\u201d headlines irresponsible and unethical.",M5(31),CREAM,50)
    foot(d,5,GREY); im.convert("RGB").save(OUT+"slide-5.jpg",quality=92)

def s6():
    im,d=base(31)
    y=big(d,M,270,["WAIT FOR","THE LAB."],150,[CREAM,YEL])
    y=para(d,M,y+28,"Genesis doesn't get truer when radar finds a right angle. It doesn't get shakier while a lab is still running.",M5(33),CREAM,48)
    y=para(d,M,y+26,"Did this show up on your feed this week? Tell us in the comments.",MB(31),CREAM,48)
    para(d,M,y+22,"Full story: link in bio",M5(28),GREY,60)
    foot(d,6,GREY); im.convert("RGB").save(OUT+"slide-6.jpg",quality=92)

hero(); s1(); s2(); s3(); s4(); s5(); s6()
ims=[Image.open(OUT+f"slide-{i}.jpg") for i in range(1,N+1)]
c=Image.new("RGB",(360*N+20*(N-1),450),(20,20,20))
for i,im in enumerate(ims): c.paste(im.resize((360,450)),(i*380,0))
c.save(OUT+"contact.png")
print("built:", sorted(os.listdir(OUT)))
