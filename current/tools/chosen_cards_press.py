import numpy as np, textwrap, os
from PIL import Image, ImageDraw, ImageFont

INK=(14,13,10); CREAM=(247,244,236); YEL=(253,226,10); GREY=(170,164,150)
F="/tmp/fonts/"
BEB=lambda s: ImageFont.truetype(F+"BebasNeue.ttf",s)
MB =lambda s: ImageFont.truetype(F+"Montserrat-Bold.ttf",s)
M6 =lambda s: ImageFont.truetype(F+"Montserrat-600.ttf",s)
M5 =lambda s: ImageFont.truetype(F+"Montserrat-500.ttf",s)
SER="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"
SRC="/tmp/chosen/src/"; OUT="/tmp/chosen/out2/"
os.makedirs(OUT,exist_ok=True)
W,H,M=1080,1350,80
N=6

def cover(path, frac=None, target=(W,H)):
    im=Image.open(SRC+path).convert("RGB")
    if frac:
        l,t,r,b=frac; w,h=im.size
        im=im.crop((int(l*w),int(t*h),int(r*w),int(b*h)))
    tw_,th_=target; sw,sh=im.size
    s=max(tw_/sw, th_/sh)
    im=im.resize((int(sw*s+0.5),int(sh*s+0.5)), Image.LANCZOS)
    sw,sh=im.size
    return im.crop(((sw-tw_)//2,(sh-th_)//2,(sw-tw_)//2+tw_,(sh-th_)//2+th_))

def scrim(im, top_h=260, top_a=170, bot_y=560, bot_a=238):
    """Darken the top band (for the masthead) and the lower area (for text)."""
    ov=Image.new("L",(W,H),0); d=ImageDraw.Draw(ov)
    for y in range(top_h):
        d.line([(0,y),(W,y)], fill=int(top_a*(1-y/top_h)))
    for y in range(bot_y,H):
        t=(y-bot_y)/(H-bot_y)
        d.line([(0,y),(W,y)], fill=int(bot_a*min(1.0,t*1.45)))
    black=Image.new("RGB",(W,H),(8,7,6))
    return Image.composite(black, im, ov)

def tracked(d,x,y,t,f,fill,tr=4):
    for c in t: d.text((x,y),c,font=f,fill=fill); x+=d.textlength(c,font=f)+tr
    return x
def tw(d,t,f,tr=4): return sum(d.textlength(c,font=f)+tr for c in t)-tr

def head(d,fg=CREAM):
    B=BEB(84); d.text((M,70),"5TALENTS",font=B,fill=fg)
    lab=MB(22); lw=tw(d,"SCREEN",lab); rx=W-M-lw
    lx=M+d.textlength("5TALENTS",font=B)+28
    d.line([(lx,114),(rx-28,114)],fill=fg,width=3); tracked(d,rx,101,"SCREEN",lab,fg)

def foot(d,n,fg=GREY,credit=None):
    f=M5(21); d.text((M,H-110),f"{n}/{N}",font=f,fill=fg)
    t="5talentsmag.com/screen"; d.text((W-M-d.textlength(t,font=f),H-110),t,font=f,fill=fg)
    if credit:
        c=M5(19); d.text((M,H-74),credit,font=c,fill=(132,128,118))

def para(d,x,y,text,f,fill,width,lh=1.38):
    for line in textwrap.wrap(text,width):
        d.text((x,y),line,font=f,fill=fill); y+=int(f.size*lh)
    return y

def big_up(d,x,ybase,lines,size,cols):
    """Draw block upward from a baseline so text sits on the lower scrim."""
    f=BEB(size); step=int(size*0.93)
    y=ybase-step*len(lines)
    for l,c in zip(lines,cols): d.text((x,y),l,font=f,fill=c); y+=step
    return ybase

CRED="Images: The Chosen / Prime Video"

# 1 — poster, headline
im=scrim(cover("poster.png",(0.19,0.0,0.91,0.72)), bot_y=600, bot_a=248); d=ImageDraw.Draw(im); head(d)
tracked(d,M+4,700,"THE CHOSEN  ·  THE LAST DAY ON SET",MB(23),YEL)
y=big_up(d,M,1105,["THEY FILMED","THE LAST","SCENE."],132,[CREAM,CREAM,YEL])
para(d,M,y+14,"Eight years. 528 days on set. It is finished.",M6(32),CREAM,46)
f=MB(26); ax=W-M-46; t="Swipe"
d.text((ax-14-d.textlength(t,font=f),H-190),t,font=f,fill=YEL)
yy=H-174; d.line([(ax,yy),(ax+44,yy)],fill=YEL,width=4)
d.polygon([(ax+46,yy),(ax+33,yy-9),(ax+33,yy+9)],fill=YEL)
foot(d,1,credit=CRED); im.save(OUT+"slide-1.jpg",quality=92)

# 2 — yellow type card
im=Image.new("RGB",(W,H),YEL); d=ImageDraw.Draw(im); head(d,INK)
tracked(d,M+4,250,"WHERE IT ENDED",MB(24),INK)
y=300
f=BEB(132)
for l in ["528 DAYS.","EIGHT YEARS."]:
    d.text((M,y),l,font=f,fill=INK); y+=int(132*0.93)
y=para(d,M,y+26,"Filming wrapped on Thursday 24 September near Dallas, Texas.",M5(32),INK,50)
para(d,M,y+26,"It began as a crowdfunded pilot with no distribution deal. More than 300 million people have watched it since.",MB(30),INK,52)
foot(d,2,INK); im.save(OUT+"slide-2.jpg",quality=92)

# 3 — arrest still, Roumie's verse
im=scrim(cover("arrest.jpg",(0.23,0.0,0.77,1.0)), bot_y=500, bot_a=248); d=ImageDraw.Draw(im); head(d)
tracked(d,M+4,600,"THE MAN WHO PLAYED JESUS",MB(23),YEL)
q=ImageFont.truetype(SER,48)
y=para(d,M,654,"“I have fought the good fight; I have finished the race; I have kept the faith.”",q,CREAM,31,1.3)
tracked(d,M,y+18,"JONATHAN ROUMIE, QUOTING 2 TIMOTHY 4:7",MB(21),YEL)
para(d,M,y+86,"He posted it the day his part ended, with four words before it: “the hour has finally come.”",M5(29),CREAM,52)
foot(d,3,credit=CRED); im.save(OUT+"slide-3.jpg",quality=92)

# 4 — dark type card, the cast
im=Image.new("RGB",(W,H),(17,15,13)); d=ImageDraw.Draw(im); head(d)
tracked(d,M+4,250,"HOW THE CAST SAID GOODBYE",MB(23),YEL)
y=300; f=BEB(106)
for l,c in zip(["HE FILMED","HIMSELF TAKING","OFF THE SANDALS."],[CREAM,CREAM,YEL]):
    d.text((M,y),l,font=f,fill=c); y+=int(106*0.93)
y=para(d,M,y+28,"Giavani Cairo, who plays Thaddeus, recorded the moment he took the costume off for the last time.",M5(31),CREAM,52)
para(d,M,y+24,"Austin Reed Alleman posted his first day on set, 13 October 2020, beside his last, 24 September 2026.",M5(31),CREAM,52)
foot(d,4); im.save(OUT+"slide-4.jpg",quality=92)

# 5 — poster detail, Jenkins
im=scrim(cover("poster.png",(0.10,0.40,0.62,0.90)), bot_y=520, bot_a=248); d=ImageDraw.Draw(im); head(d)
tracked(d,M+4,616,"AT THE WRAP PARTY",MB(23),YEL)
q=ImageFont.truetype(SER,42)
y=para(d,M,670,"“My eyes are a little teary from the crying I’ve been doing tonight, but my immense gratitude, that’s the word that just keeps going over and over.”",q,CREAM,37,1.3)
tracked(d,M,y+18,"DALLAS JENKINS, CREATOR",MB(21),YEL)
para(d,M,y+86,"He said he will never fully understand why he was the one chosen to make it.",M5(29),CREAM,52)
foot(d,5,credit=CRED); im.save(OUT+"slide-5.jpg",quality=92)

# 6 — arrest still, what's next
im=scrim(cover("arrest.jpg",(0.42,0.0,1.0,1.0)), bot_y=500, bot_a=250); d=ImageDraw.Draw(im); head(d)
tracked(d,M+4,600,"WHAT YOU STILL GET TO SEE",MB(23),YEL)
y=654; f=BEB(118)
for l,c in zip(["THE STORY","ISN'T OUT YET."],[CREAM,YEL]):
    d.text((M,y),l,font=f,fill=c); y+=int(118*0.93)
y=para(d,M,y+22,"Season 6, the crucifixion, reaches Prime Video on 15 November. Season 7, the resurrection, arrives in 2028.",M5(30),CREAM,52)
y=para(d,M,y+22,"Which scene are you waiting for? Tell us in the comments.",MB(29),CREAM,50)
para(d,M,y+18,"Full story: link in bio",M5(26),GREY,60)
foot(d,6,credit=CRED); im.save(OUT+"slide-6.jpg",quality=92)

ims=[Image.open(OUT+f"slide-{i}.jpg") for i in range(1,N+1)]
c=Image.new("RGB",(360*N+20*(N-1),450),(20,20,20))
for i,x in enumerate(ims): c.paste(x.resize((360,450)),(i*380,0))
c.save(OUT+"contact.png")
print("built:", sorted(os.listdir(OUT)))
