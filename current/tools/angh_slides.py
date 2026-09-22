import sys; sys.path.insert(0,'/tmp/ig')
import ig_screen as S
from PIL import Image, ImageDraw, ImageFont
W,H=1080,1350; S.W,S.H=W,H
M=80
CREAM,YEL,GREY,INK=S.CREAM,S.YEL,S.GREY,S.INK
CRED="Photo: Alamelu___ / Pixabay  ·  not a still from the film"

def grad(im,y0,y1,a0,a1):
    d=ImageDraw.Draw(im)
    for y in range(y0,y1):
        a=int(a0+(a1-a0)*(y-y0)/max(1,y1-y0)); d.line([(0,y),(W,y)],fill=(12,11,9,a))

def header(d,fg=CREAM): S.header(d,fg)

# S1 overlay: photo full-bleed behind
def s1():
    im=Image.new('RGBA',(W,H),(0,0,0,0)); grad(im,0,260,200,0); grad(im,640,H,0,240)
    d=ImageDraw.Draw(im); header(d)
    S.tracked(d,M+4,760,"ANGH  ·  TIFF PLATFORM PRIZE 2026",S.MB(24),YEL)
    y=S.big(d,M,800,["FOLLOW CHRIST.","KEEP YOUR","CULTURE?"],150,[CREAM,CREAM,YEL])
    d.text((M,H-112),CRED,font=S.M5(21),fill=GREY)
    f=S.MB(28); ax=W-M-50; t="Swipe"; d.text((ax-16-d.textlength(t,font=f),H-172),t,font=f,fill=YEL)
    yy=H-155; d.line([(ax,yy),(ax+48,yy)],fill=YEL,width=4); d.polygon([(ax+50,yy),(ax+36,yy-10),(ax+36,yy+10)],fill=YEL)
    im.save('/tmp/angh/ov1.png')

# S2/S4 overlay: photo occupies top 0..760, dark panel below
def panel(name,kicker,title_lines,body,n,cols=None):
    im=Image.new('RGBA',(W,H),(0,0,0,0)); grad(im,0,220,190,0); grad(im,640,760,0,255)
    d=ImageDraw.Draw(im); d.rectangle([0,760,W,H],fill=(16,14,12,255))
    header(d)
    d.text((M,712),CRED,font=S.M5(19),fill=(200,195,185))
    S.tracked(d,M+4,790,kicker,S.MB(24),YEL)
    y=S.big(d,M,830,title_lines,110,cols or [CREAM]*len(title_lines))
    y=S.para(d,M,y+14,body,S.M5(31),CREAM,52,1.38)
    S.footer(d,n,GREY)
    im.save(f'/tmp/angh/{name}')

def s3():
    im=S.bg(seed=13); d=ImageDraw.Draw(im); S.strip(d,0); S.strip(d,H-40); header(d)
    S.tracked(d,M+4,250,"IS IT ANTI-CHRISTIAN?",S.MB(26),YEL)
    y=S.big(d,M,300,["NOT SO","SIMPLE."],180,[CREAM,YEL])
    q=ImageFont.truetype(S.SER,50)
    y=S.para(d,M,y+30,"“He is not presented simply as a villain.”",q,CREAM,30,1.3)
    S.tracked(d,M,y+14,"INTERNATIONAL CINEPHILE SOCIETY, ON THE MISSIONARY",S.MB(20),GREY)
    S.para(d,M,y+80,"Critics say the film grieves a lost way of life, but shows why people were drawn to church, school and medicine too.",S.M5(33),CREAM,50)
    S.footer(d,3,GREY); im.convert('RGB').save('/tmp/angh/s3.jpg',quality=92)

def s5():
    im=S.bg(seed=29); d=ImageDraw.Draw(im); S.strip(d,0); S.strip(d,H-40); header(d)
    q=ImageFont.truetype(S.SER,48)
    y=S.para(d,M,230,"“A great multitude… of all nations, and kindreds, and people, and tongues.”",q,CREAM,32,1.3)
    S.tracked(d,M,y+16,"REVELATION 7:9 (KJV)",S.MB(24),YEL)
    y=S.big(d,M,y+90,["CAN YOU FOLLOW","JESUS AND KEEP","YOUR CULTURE?"],118,[CREAM,CREAM,YEL])
    y=S.para(d,M,y+26,"Tell us in the comments. Tag a friend from the Northeast.",S.MB(32),CREAM,48)
    S.para(d,M,y+22,"Full story: link in bio",S.M5(28),GREY,60)
    S.footer(d,5,GREY); im.convert('RGB').save('/tmp/angh/s5.jpg',quality=92)

s1()
panel('ov2.png',"THE FILM",["1962. THE LAST","HOLDOUTS."],"A Konyak chief and his son hold on to the old ways as a road, a school and an American missionary arrive. First Indian film to win Toronto's Platform Prize. Now Oscar-eligible.",2,[CREAM,YEL])
s3()
panel('ov4.png',"THE HISTORY",["THEY LEFT","THE MORUNG."],"Nagaland is 88% Christian. Faith reached Konyak villages from the late 1950s, mostly through Ao Naga evangelists. Converts were told to leave the morung, the village men's house.",4,[CREAM,YEL])
s5()
print('ok')
