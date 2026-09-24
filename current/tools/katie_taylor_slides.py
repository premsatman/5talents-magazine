import sys; sys.path.insert(0,'/tmp/ig')
import ig_screen as S
from PIL import Image, ImageDraw, ImageFont
W,H=1080,1350; M=80
CREAM,YEL,GREY=S.CREAM,S.YEL,S.GREY
OUT='/tmp/kt/out/'
import os; os.makedirs(OUT,exist_ok=True)


def footer(d,n,fg):
    f=S.M5(22); d.text((M,H-112),f"{n}/5",font=f,fill=fg)
    t="5talentsmag.com/current"; d.text((W-M-d.textlength(t,font=f),H-112),t,font=f,fill=fg)

def base(seed):
    im=S.bg(seed=seed); d=ImageDraw.Draw(im); S.strip(d,0); S.strip(d,H-40)
    # header with CURRENT
    B=S.BEB(74); d.text((M,60),"5TALENTS",font=B,fill=CREAM)
    lab=S.MB(22); lw=S.tw(d,"CURRENT",lab); rx=W-M-lw
    lx=M+d.textlength("5TALENTS",font=B)+26
    d.line([(lx,100),(rx-26,100)],fill=CREAM,width=2); S.tracked(d,rx,88,"CURRENT",lab,CREAM)
    return im,d

def s1():
    im,d=base(9)
    S.tracked(d,M+4,250,"KATIE TAYLOR  ·  HER LAST FIGHT",S.MB(24),YEL)
    y=S.big(d,M,300,["SHE","WORSHIPPED","BEFORE","THE BELL."],140,[CREAM,CREAM,CREAM,YEL])
    S.para(d,M,y+30,"Croke Park, 5 September. 82,000 people in the stadium.",S.M5(34),CREAM,46)
    f=S.MB(28); ax=W-M-50; t="Swipe"
    d.text((ax-16-d.textlength(t,font=f),H-172),t,font=f,fill=YEL)
    yy=H-155; d.line([(ax,yy),(ax+48,yy)],fill=YEL,width=4)
    d.polygon([(ax+50,yy),(ax+36,yy-10),(ax+36,yy+10)],fill=YEL)
    im.convert('RGB').save(OUT+'slide-1.jpg',quality=92)

def s2():
    im,d=base(15)
    S.tracked(d,M+4,250,"THE RING WALK",S.MB(24),YEL)
    y=S.big(d,M,300,["ALL HAIL","KING JESUS."],130,[CREAM,YEL])
    S.para(d,M,y+26,"Ireland's greatest boxer chose a Bethel worship song for the last ring walk of her career. Not a clip buried under a hype reel. The whole stadium got the chorus.",S.M5(32),CREAM,50)
    footer(d,2,GREY); im.convert('RGB').save(OUT+'slide-2.jpg',quality=92)

def s3():
    im,d=base(27)
    S.tracked(d,M+4,250,"ON HER ROBE",S.MB(24),YEL)
    y=S.big(d,M,300,["PSALM 18,","IN GOLD."],130,[CREAM,YEL])
    q=ImageFont.truetype(S.SER,44)
    y=S.para(d,M,y+26,"“This is a Psalm that I regularly read when I am away in competition. It’s God who trains my mind for battle and He is my shield of victory.”",q,CREAM,34,1.3)
    S.tracked(d,M,y+16,"KATIE TAYLOR",S.MB(22),GREY)
    footer(d,3,GREY); im.convert('RGB').save(OUT+'slide-3.jpg',quality=92)

def s4():
    im,d=base(35)
    S.tracked(d,M+4,250,"THEN SHE BOXED",S.MB(24),YEL)
    y=S.big(d,M,300,["UNDISPUTED.","AT 40."],130,[CREAM,YEL])
    S.para(d,M,y+26,"Ten rounds against Flora Pili. Unanimous decision. She kept three belts, took two more, and became the oldest fighter of any gender ever to be undisputed champion. Then she retired.",S.M5(32),CREAM,50)
    footer(d,4,GREY); im.convert('RGB').save(OUT+'slide-4.jpg',quality=92)

def s5():
    im,d=base(41)
    y=S.big(d,M,250,["ANYONE CAN","THANK GOD","AFTER."],124,[CREAM,CREAM,YEL])
    y=S.para(d,M,y+26,"She did it on the way in — before the first bell, while she could still have lost in front of 82,000 people.",S.M5(33),CREAM,48)
    y=S.para(d,M,y+26,"Where is it costly for you to be known? Tell us in the comments.",S.MB(31),CREAM,48)
    S.para(d,M,y+22,"Full story: link in bio",S.M5(28),GREY,60)
    footer(d,5,GREY); im.convert('RGB').save(OUT+'slide-5.jpg',quality=92)

s1(); s2(); s3(); s4(); s5()
ims=[Image.open(OUT+f'slide-{i}.jpg') for i in range(1,6)]
m=Image.new('RGB',(432*5+24,540),(20,20,20))
for i,im in enumerate(ims): m.paste(im.resize((432,540)),(i*438,0))
m.save(OUT+'contact.png'); print('slides ok')
