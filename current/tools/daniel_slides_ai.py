import sys; sys.path.insert(0,'/tmp/ig')
import ig_screen as S
from PIL import Image, ImageDraw, ImageFont
W,H=1080,1350; M=80
CREAM,YEL,GREY=S.CREAM,S.YEL,S.GREY
SRC="/root/.claude/uploads/e80bf518-b893-5604-8a8f-d58bebac26cc/"
OUT="/tmp/daniel/out2/"
import os; os.makedirs(OUT,exist_ok=True)
CRED="Illustration: AI-generated for 5Talents"

def grad(im,y0,y1,a0,a1):
    d=ImageDraw.Draw(im)
    for y in range(y0,y1):
        a=int(a0+(a1-a0)*(y-y0)/max(1,y1-y0)); d.line([(0,y),(W,y)],fill=(12,11,9,a))

def art(path,box,size):
    return Image.open(SRC+path).convert('RGB').crop(box).resize(size,Image.LANCZOS)

def s1():
    base=art('be63cb56-image.png',(0,100,1024,1380),(W,H))
    ov=Image.new('RGBA',(W,H),(0,0,0,0)); grad(ov,0,300,205,0); grad(ov,620,H,0,245)
    d=ImageDraw.Draw(ov); S.header(d,CREAM)
    S.tracked(d,M+4,760,"DANIEL AND THE FIERY FURNACE",S.MB(24),YEL)
    S.big(d,M,800,["THEY SHOT","BABYLON","IN INDIA."],150,[CREAM,CREAM,YEL])
    d.text((M,H-112),CRED,font=S.M5(21),fill=GREY)
    f=S.MB(28); ax=W-M-50; t="Swipe"
    d.text((ax-16-d.textlength(t,font=f),H-172),t,font=f,fill=YEL)
    yy=H-155; d.line([(ax,yy),(ax+48,yy)],fill=YEL,width=4)
    d.polygon([(ax+50,yy),(ax+36,yy-10),(ax+36,yy+10)],fill=YEL)
    base.paste(ov,(0,0),ov); base.save(OUT+'slide-1.jpg',quality=92)

def panel(path,box,kicker,lines,body,n,out,sizes=130):
    base=Image.new('RGB',(W,H),(16,14,12))
    base.paste(art(path,box,(W,800)),(0,0))
    ov=Image.new('RGBA',(W,H),(0,0,0,0)); grad(ov,0,240,195,0); grad(ov,640,760,0,255)
    d=ImageDraw.Draw(ov); d.rectangle([0,760,W,H],fill=(16,14,12,255))
    S.header(d,CREAM)
    d.text((M,712),CRED,font=S.M5(19),fill=(205,200,190))
    S.tracked(d,M+4,790,kicker,S.MB(24),YEL)
    y=S.big(d,M,830,lines,sizes,[CREAM]*(len(lines)-1)+[YEL])
    S.para(d,M,y+14,body,S.M5(30),CREAM,52,1.38)
    S.footer(d,n,GREY)
    base.paste(ov,(0,0),ov); base.save(OUT+out,quality=92)

s1()
panel('dba0bdee-image.png',(700,0,1536,620),"WHO IS PLAYING DANIEL",
      ["THE KID FROM","THE CHURCH PLAYS."],
      "Mena Massoud is Coptic. “I grew up doing church plays and Stations of the Cross in elementary school,” he told Crosswalk. He reads Daniel as an immigrant story.",2,'slide-2.jpg',sizes=104)
panel('be63cb56-image.png',(0,250,1024,1008),"ON SET, IN INDIA",
      ["THE THUNDER","CAME IN ON CUE."],
      "Filming Daniel 2, as the lines about an everlasting kingdom were spoken, the wind rose and tents blew across the set. That is the directors’ own account of the day.",3,'slide-3.jpg',sizes=104)

import shutil
shutil.copy('/tmp/daniel/out/slide-4.jpg',OUT+'slide-4.jpg')
shutil.copy('/tmp/daniel/out/slide-5.jpg',OUT+'slide-5.jpg')

ims=[Image.open(OUT+f'slide-{i}.jpg') for i in range(1,6)]
m=Image.new('RGB',(432*5+24,540),(20,20,20))
for i,im in enumerate(ims): m.paste(im.resize((432,540)),(i*438,0))
m.save(OUT+'contact.png'); print('ok')
