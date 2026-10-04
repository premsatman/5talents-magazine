import textwrap
from PIL import Image, ImageDraw, ImageFont
INK=(14,13,10); CREAM=(247,244,236); YEL=(253,226,10); GREY=(170,164,150)
F="/tmp/fonts/"
BEB=lambda s: ImageFont.truetype(F+"BebasNeue.ttf",s)
MB =lambda s: ImageFont.truetype(F+"Montserrat-Bold.ttf",s)
M5 =lambda s: ImageFont.truetype(F+"Montserrat-500.ttf",s)
OUT="/tmp/chosen/out2/"; W,H,M=1080,1350,80; N=6
IMG_H=880

def tracked(d,x,y,t,f,fill,tr=4):
    for c in t: d.text((x,y),c,font=f,fill=fill); x+=d.textlength(c,font=f)+tr
    return x
def tw(d,t,f,tr=4): return sum(d.textlength(c,font=f)+tr for c in t)-tr

# square source -> 1080 x IMG_H band (only a 1.125x upscale, so it stays sharp)
src=Image.open("/tmp/chosen/src/bts-jenkins.jpg").convert("RGB")
s=max(W/src.width, IMG_H/src.height)
band=src.resize((int(src.width*s+0.5),int(src.height*s+0.5)), Image.LANCZOS)
bw,bh=band.size
band=band.crop(((bw-W)//2, int((bh-IMG_H)*0.42), (bw-W)//2+W, int((bh-IMG_H)*0.42)+IMG_H))

im=Image.new("RGB",(W,H),INK); im.paste(band,(0,0))
d=ImageDraw.Draw(im)

# top scrim so the masthead reads over the photograph
ov=Image.new("L",(W,H),0); od=ImageDraw.Draw(ov)
for y in range(230): od.line([(0,y),(W,y)], fill=int(165*(1-y/230)))
im=Image.composite(Image.new("RGB",(W,H),(8,7,6)), im, ov); d=ImageDraw.Draw(im)

# masthead
B=BEB(84); d.text((M,70),"5TALENTS",font=B,fill=CREAM)
lab=MB(22); lw=tw(d,"SCREEN",lab); rx=W-M-lw
lx=M+d.textlength("5TALENTS",font=B)+28
d.line([(lx,114),(rx-28,114)],fill=CREAM,width=3); tracked(d,rx,101,"SCREEN",lab,CREAM)

# type panel
d.rectangle([0,IMG_H,W,H],fill=INK)
tracked(d,M+4,IMG_H+34,"THE CHOSEN  ·  THE LAST DAY ON SET",MB(22),YEL)
y=IMG_H+76; f=BEB(104)
for l,c in zip(["THEY FILMED","THE LAST SCENE."],[CREAM,YEL]):
    d.text((M,y),l,font=f,fill=c); y+=int(104*0.93)
d.text((M,y+10),"Eight years. 528 days on set. It is finished.",font=M5(29),fill=CREAM)

# swipe
f=MB(26); ax=W-M-46; t="Swipe"
d.text((ax-14-d.textlength(t,font=f),IMG_H+96),t,font=f,fill=YEL)
yy=IMG_H+112; d.line([(ax,yy),(ax+44,yy)],fill=YEL,width=4)
d.polygon([(ax+46,yy),(ax+33,yy-9),(ax+33,yy+9)],fill=YEL)

# footer + share-alike credit
ff=M5(21); d.text((M,H-110),f"1/{N}",font=ff,fill=GREY)
t="5talentsmag.com/screen"; d.text((W-M-d.textlength(t,font=ff),H-110),t,font=ff,fill=GREY)
d.text((M,H-74),"Photo: The Chosen, CC BY-SA 4.0 · this card shared under the same licence",
       font=M5(18),fill=(132,128,118))

im.save(OUT+"slide-1.jpg",quality=93)

ims=[Image.open(OUT+f"slide-{i}.jpg") for i in range(1,N+1)]
c=Image.new("RGB",(360*N+20*(N-1),450),(20,20,20))
for i,x in enumerate(ims): c.paste(x.resize((360,450)),(i*380,0))
c.save(OUT+"contact.png")
print("slide 1 rebuilt")
