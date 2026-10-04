import numpy as np, textwrap, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

INK=(14,13,10); CREAM=(247,244,236); YEL=(253,226,10); GREY=(170,164,150)
F="/tmp/fonts/"
BEB=lambda s: ImageFont.truetype(F+"BebasNeue.ttf",s)
MB =lambda s: ImageFont.truetype(F+"Montserrat-Bold.ttf",s)
M6 =lambda s: ImageFont.truetype(F+"Montserrat-600.ttf",s)
M5 =lambda s: ImageFont.truetype(F+"Montserrat-500.ttf",s)
SER="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"
OUT="/tmp/chosen/out/"

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

def head(d,W,M,fg,label="SCREEN",bs=84,ty=70,ly=114):
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

def hero():
    W,H,M=1600,900,96
    im=bg(W,H,seed=3); d=ImageDraw.Draw(im); strip(d,0,W); strip(d,H-40,W)
    head(d,W,M,CREAM,bs=72,ty=64,ly=100)
    tracked(d,M+4,300,"THE CHOSEN  ·  THE LAST DAY ON SET",MB(24),YEL)
    y=big(d,M,352,["528 DAYS.","THEN THEY WENT HOME."],150,[CREAM,YEL])
    para(d,M,y+26,"Eight years, a crowdfunded pilot nobody was watching, and a cast taking off their sandals for the last time.",M6(32),CREAM,72)
    im.convert("RGB").save(OUT+"hero.jpg",quality=93)

W,H,M=1080,1350,80
N=6
def foot(d,n,fg):
    f=M5(22); d.text((M,H-112),f"{n}/{N}",font=f,fill=fg)
    t="5talentsmag.com/screen"; d.text((W-M-d.textlength(t,font=f),H-112),t,font=f,fill=fg)

def base(seed,yellow=False):
    im=bg(W,H,seed=seed,yellow=yellow); d=ImageDraw.Draw(im)
    if not yellow: strip(d,0,W); strip(d,H-40,W)
    head(d,W,M,INK if yellow else CREAM)
    return im,d

def s1():
    im,d=base(3)
    tracked(d,M+4,250,"THE CHOSEN  ·  THE LAST DAY ON SET",MB(23),YEL)
    y=big(d,M,300,["THEY FILMED","THE LAST","SCENE."],142,[CREAM,CREAM,YEL])
    para(d,M,y+30,"After eight years and 528 days on set, The Chosen has finished shooting for good.",M6(34),CREAM,44)
    f=MB(28); ax=W-M-50; t="Swipe"
    d.text((ax-16-d.textlength(t,font=f),H-172),t,font=f,fill=YEL)
    yy=H-155; d.line([(ax,yy),(ax+48,yy)],fill=YEL,width=4)
    d.polygon([(ax+50,yy),(ax+36,yy-10),(ax+36,yy+10)],fill=YEL)
    foot(d,1,GREY); im.convert("RGB").save(OUT+"slide-1.jpg",quality=92)

def s2():
    im,d=base(11)
    tracked(d,M+4,250,"WHERE IT ENDED",MB(24),YEL)
    y=big(d,M,300,["528 DAYS.","EIGHT YEARS."],132,[CREAM,YEL])
    y=para(d,M,y+26,"Filming wrapped on Thursday 24 September near Dallas, Texas.",M5(32),CREAM,50)
    para(d,M,y+26,"It began as a crowdfunded pilot with no distribution deal. It has now been watched by more than 300 million people.",MB(30),YEL,52)
    foot(d,2,GREY); im.convert("RGB").save(OUT+"slide-2.jpg",quality=92)

def s3():
    im,d=base(0,yellow=True)
    tracked(d,M+4,250,"THE MAN WHO PLAYED JESUS",MB(24),INK)
    q=ImageFont.truetype(SER,50)
    y=para(d,M,320,"“I have fought the good fight; I have finished the race; I have kept the faith.”",q,INK,30,1.3)
    tracked(d,M,y+20,"JONATHAN ROUMIE, QUOTING 2 TIMOTHY 4:7",MB(22),INK)
    para(d,M,y+92,"He posted it the day his part ended, with four words before it: “the hour has finally come.”",M5(31),INK,50)
    foot(d,3,INK); im.convert("RGB").save(OUT+"slide-3.jpg",quality=92)

def s4():
    im,d=base(17)
    tracked(d,M+4,250,"HOW THE CAST SAID GOODBYE",MB(23),YEL)
    y=big(d,M,300,["HE FILMED","HIMSELF TAKING","OFF THE SANDALS."],108,[CREAM,CREAM,YEL])
    y=para(d,M,y+26,"Giavani Cairo, who plays Thaddeus, recorded the moment he took the costume off for the last time.",M5(31),CREAM,52)
    para(d,M,y+24,"Austin Reed Alleman posted his first day on set, 13 October 2020, beside his last, 24 September 2026.",M5(31),CREAM,52)
    foot(d,4,GREY); im.convert("RGB").save(OUT+"slide-4.jpg",quality=92)

def s5():
    im,d=base(23)
    tracked(d,M+4,250,"AT THE WRAP PARTY",MB(24),YEL)
    q=ImageFont.truetype(SER,44)
    y=para(d,M,310,"“My eyes are a little teary from the crying I’ve been doing tonight, but my immense gratitude, that’s the word that just keeps going over and over.”",q,CREAM,36,1.3)
    tracked(d,M,y+20,"DALLAS JENKINS, CREATOR",MB(22),GREY)
    para(d,M,y+92,"He also said he will never fully understand why he was the one chosen to make it.",M5(31),CREAM,52)
    foot(d,5,GREY); im.convert("RGB").save(OUT+"slide-5.jpg",quality=92)

def s6():
    im,d=base(29)
    tracked(d,M+4,250,"WHAT YOU STILL GET TO SEE",MB(23),YEL)
    y=big(d,M,300,["THE STORY","ISN'T OUT YET."],130,[CREAM,YEL])
    y=para(d,M,y+26,"Season 6, the crucifixion, reaches Prime Video on 15 November, then cinemas in spring 2027. Season 7, the resurrection, arrives in 2028.",M5(31),CREAM,52)
    y=para(d,M,y+24,"Which scene are you waiting for? Tell us in the comments.",MB(30),CREAM,50)
    para(d,M,y+20,"Full story: link in bio",M5(28),GREY,60)
    foot(d,6,GREY); im.convert("RGB").save(OUT+"slide-6.jpg",quality=92)

hero(); s1(); s2(); s3(); s4(); s5(); s6()
ims=[Image.open(OUT+f"slide-{i}.jpg") for i in range(1,N+1)]
c=Image.new("RGB",(360*N+20*(N-1),450),(20,20,20))
for i,im in enumerate(ims): c.paste(im.resize((360,450)),(i*380,0))
c.save(OUT+"contact.png")
print("built:", sorted(os.listdir(OUT)))
