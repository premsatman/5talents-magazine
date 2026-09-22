import sys
sys.path.insert(0,'/tmp/ig')
import numpy as np
from PIL import Image, ImageDraw
import ig_screen as S
S.W,S.H=1200,1600
W,H=S.W,S.H
def make(label,tag,out,seed=7):
    im=S.bg(seed=seed); d=ImageDraw.Draw(im)
    S.strip(d,0); S.strip(d,H-40)
    # header scaled
    from PIL import ImageFont
    B=S.BEB(96); M=90
    d.text((M,90),"5TALENTS",font=B,fill=S.CREAM)
    lab=S.MB(24); lw=S.tw(d,label,lab); rx=W-M-lw
    lx=M+d.textlength("5TALENTS",font=B)+30
    d.line([(lx,140),(rx-30,140)],fill=S.CREAM,width=3); S.tracked(d,rx,126,label,lab,S.CREAM)
    f=S.MB(30); w=S.tw(d,tag,f)
    S.tracked(d,(W-w)/2,H-190,tag,f,S.YEL)
    im.save(out,quality=92)
make("SCREEN","DOCUSERIES  ·  3 EPISODES","pw_portrait.jpg",seed=7)
make("SCREEN","SEASON 6  ·  EPISODE 1","chosen_portrait.jpg",seed=31)
