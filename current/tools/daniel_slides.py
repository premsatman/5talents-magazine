import sys; sys.path.insert(0,'/tmp/ig')
import ig_screen as S
from PIL import Image, ImageDraw, ImageFont
W,H=1080,1350; M=80
CREAM,YEL,GREY=S.CREAM,S.YEL,S.GREY
OUT='/tmp/daniel/out/'
import os; os.makedirs(OUT,exist_ok=True)

def base(seed):
    im=S.bg(seed=seed); d=ImageDraw.Draw(im); S.strip(d,0); S.strip(d,H-40); S.header(d,CREAM); return im,d

def s1():
    im,d=base(5)
    S.tracked(d,M+4,250,"DANIEL AND THE FIERY FURNACE",S.MB(24),YEL)
    y=S.big(d,M,300,["THEY SHOT","BABYLON","IN INDIA."],150,[CREAM,CREAM,YEL])
    y=S.para(d,M,y+30,"Mena Massoud's biblical epic opened big in America. There is still no Indian release date.",S.M5(34),CREAM,46)
    f=S.MB(28); ax=W-M-50; t="Swipe"
    d.text((ax-16-d.textlength(t,font=f),H-172),t,font=f,fill=YEL)
    yy=H-155; d.line([(ax,yy),(ax+48,yy)],fill=YEL,width=4); d.polygon([(ax+50,yy),(ax+36,yy-10),(ax+36,yy+10)],fill=YEL)
    im.convert('RGB').save(OUT+'slide-1.jpg',quality=92)

def s2():
    im,d=base(11)
    S.tracked(d,M+4,250,"WHO IS PLAYING DANIEL",S.MB(24),YEL)
    y=S.big(d,M,300,["THE KID FROM","THE CHURCH","PLAYS."],130,[CREAM,CREAM,YEL])
    q=ImageFont.truetype(S.SER,44)
    y=S.para(d,M,y+26,"“I grew up doing church plays and Stations of the Cross in elementary school. The church was a big part of my life as a Coptic Christian.”",q,CREAM,34,1.3)
    S.tracked(d,M,y+16,"MENA MASSOUD, TO CROSSWALK",S.MB(22),GREY)
    S.footer(d,2,GREY); im.convert('RGB').save(OUT+'slide-2.jpg',quality=92)

def s3():
    im,d=base(21)
    S.tracked(d,M+4,250,"ON SET, IN INDIA",S.MB(24),YEL)
    y=S.big(d,M,300,["THE THUNDER","CAME IN","ON CUE."],130,[CREAM,CREAM,YEL])
    q=ImageFont.truetype(S.SER,44)
    y=S.para(d,M,y+26,"“As he's talking about an everlasting Kingdom coming, the thunder rolled in, out of nowhere.”",q,CREAM,34,1.3)
    S.tracked(d,M,y+16,"MATTHEW KOOMAN, DIRECTOR",S.MB(22),GREY)
    S.para(d,M,y+74,"Flags came down. Food tents blew across the set. They kept the cameras rolling. That is the crew's own account of the day.",S.M5(31),CREAM,50)
    S.footer(d,3,GREY); im.convert('RGB').save(OUT+'slide-3.jpg',quality=92)

def s4():
    im,d=base(33)
    S.tracked(d,M+4,250,"THE NUMBERS",S.MB(24),YEL)
    y=S.big(d,M,300,["CRITICS: NO.","AUDIENCE:","96%."],130,[CREAM,CREAM,YEL])
    y=S.para(d,M,y+26,"$3.3 million on its opening weekend across 1,525 theatres, sixth place that week, from a first-time distributor. The New York Times said it “barely manages to reach room temperature”. The people who bought tickets disagreed.",S.M5(31),CREAM,50)
    S.footer(d,4,GREY); im.convert('RGB').save(OUT+'slide-4.jpg',quality=92)

def s5():
    im,d=base(29)
    q=ImageFont.truetype(S.SER,46)
    y=S.para(d,M,240,"“But if not, be it known unto thee, O king, that we will not serve thy gods.”",q,CREAM,32,1.3)
    S.tracked(d,M,y+16,"DANIEL 3:18 (KJV)",S.MB(24),YEL)
    y=S.big(d,M,y+90,["MADE HERE.","NOT SHOWING","HERE."],118,[CREAM,CREAM,YEL])
    y=S.para(d,M,y+26,"Should faith films skip India? Tell us in the comments.",S.MB(32),CREAM,48)
    S.para(d,M,y+22,"Full story: link in bio",S.M5(28),GREY,60)
    S.footer(d,5,GREY); im.convert('RGB').save(OUT+'slide-5.jpg',quality=92)

s1(); s2(); s3(); s4(); s5()
ims=[Image.open(OUT+f'slide-{i}.jpg') for i in range(1,6)]
m=Image.new('RGB',(432*5+24,540),(20,20,20))
for i,im in enumerate(ims): m.paste(im.resize((432,540)),(i*438,0))
m.save(OUT+'contact.png')
print('ok')
