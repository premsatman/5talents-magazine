"""5Talents SCREEN carousel: The Chosen Season 6 release dates (1080x1350)."""
import os, textwrap
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.abspath(__file__))
FD = BASE + "/fonts/"
BEB = lambda s: ImageFont.truetype(FD + "fontsource-bebas-neue-5.3.0/files/bebas-neue-latin-400-normal.woff2", s)
MB = lambda s: ImageFont.truetype(FD + "fontsource-montserrat-5.3.0/files/montserrat-latin-700-normal.woff2", s)
M6 = lambda s: ImageFont.truetype(FD + "fontsource-montserrat-5.3.0/files/montserrat-latin-600-normal.woff2", s)
M5 = lambda s: ImageFont.truetype(FD + "fontsource-montserrat-5.3.0/files/montserrat-latin-500-normal.woff2", s)
SER = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"

INK = (14, 13, 10); CREAM = (247, 244, 236); YEL = (253, 226, 10); GREY = (170, 164, 150)
W, H, M, N = 1080, 1350, 80, 5
OUT = BASE + "/slides/"; os.makedirs(OUT, exist_ok=True)
CRED = "Key art: Prime Video"
SRC = Image.open(BASE + "/keyart.jpg").convert("RGB")


def cover(frac):
    l, t, r, b = frac; w, h = SRC.size
    im = SRC.crop((int(l * w), int(t * h), int(r * w), int(b * h)))
    sw, sh = im.size; s = max(W / sw, H / sh)
    im = im.resize((int(sw * s + .5), int(sh * s + .5)), Image.LANCZOS)
    sw, sh = im.size
    return im.crop(((sw - W) // 2, (sh - H) // 2, (sw - W) // 2 + W, (sh - H) // 2 + H))


def scrim(im, top_h=260, top_a=170, bot_y=560, bot_a=240):
    ov = Image.new("L", (W, H), 0); d = ImageDraw.Draw(ov)
    for y in range(top_h): d.line([(0, y), (W, y)], fill=int(top_a * (1 - y / top_h)))
    for y in range(bot_y, H):
        t = (y - bot_y) / (H - bot_y); d.line([(0, y), (W, y)], fill=int(bot_a * min(1.0, t * 1.45)))
    return Image.composite(Image.new("RGB", (W, H), (8, 7, 6)), im, ov)


def tracked(d, x, y, t, f, fill, tr=4):
    for c in t: d.text((x, y), c, font=f, fill=fill); x += d.textlength(c, font=f) + tr
    return x
def tw(d, t, f, tr=4): return sum(d.textlength(c, font=f) + tr for c in t) - tr


def head(d, fg=CREAM):
    B = BEB(84); d.text((M, 70), "5TALENTS", font=B, fill=fg)
    lab = MB(22); lw = tw(d, "SCREEN", lab); rx = W - M - lw
    lx = M + d.textlength("5TALENTS", font=B) + 28
    d.line([(lx, 114), (rx - 28, 114)], fill=fg, width=3); tracked(d, rx, 101, "SCREEN", lab, fg)


def foot(d, n, fg=GREY, credit=None):
    f = M5(21); d.text((M, H - 110), f"{n}/{N}", font=f, fill=fg)
    t = "5talentsmag.com/screen"; d.text((W - M - d.textlength(t, font=f), H - 110), t, font=f, fill=fg)
    if credit: d.text((M, H - 74), credit, font=M5(19), fill=(132, 128, 118))


def para(d, x, y, text, f, fill, width, lh=1.38):
    for line in textwrap.wrap(text, width): d.text((x, y), line, font=f, fill=fill); y += int(f.size * lh)
    return y


def stack(d, x, y, lines, size, cols):
    f = BEB(size)
    for l, c in zip(lines, cols): d.text((x, y), l, font=f, fill=c); y += int(size * 0.93)
    return y


def swipe(d):
    f = MB(26); ax = W - M - 46; t = "Swipe"
    d.text((ax - 14 - d.textlength(t, font=f), H - 190), t, font=f, fill=YEL)
    yy = H - 174; d.line([(ax, yy), (ax + 44, yy)], fill=YEL, width=4)
    d.polygon([(ax + 46, yy), (ax + 33, yy - 9), (ax + 33, yy + 9)], fill=YEL)


# 1 - key art, the hook
im = scrim(cover((0.0, 0.02, 1.0, 0.74)), bot_y=430, bot_a=252); d = ImageDraw.Draw(im); head(d)
tracked(d, M + 4, 640, "THE CHOSEN  ·  SEASON 6", MB(23), YEL)
y = stack(d, M, 690, ["15 NOVEMBER.", "THREE EPISODES", "ON DAY ONE."], 128, [CREAM, CREAM, YEL])
para(d, M, y + 16, "Every date, and how to watch it from India.", M6(32), CREAM, 46)
swipe(d); foot(d, 1, credit=CRED); im.save(OUT + "slide-1.jpg", quality=92)

# 2 - yellow card, the calendar
im = Image.new("RGB", (W, H), YEL); d = ImageDraw.Draw(im); head(d, INK)
tracked(d, M + 4, 230, "THE SEASON 6 CALENDAR", MB(24), INK)
rows = [("SUN 15 NOV", "Episodes 1, 2 and 3 on Prime Video"),
        ("SUN 22 NOV", "Episode 4"), ("SUN 29 NOV", "Episode 5"), ("SUN 6 DEC", "Episode 6"),
        ("FRI 12 MAR 2027", "The finale, as a film in cinemas"),
        ("FRI 31 MAR 2028", "Season 7, the last one, in cinemas")]
y = 290
for a, b in rows:
    d.text((M, y), a, font=BEB(78), fill=INK); y += 78
    y = para(d, M, y, b, M6(30), INK, 50, 1.25) + 26
foot(d, 2, INK); im.save(OUT + "slide-2.jpg", quality=92)

# 3 - dark card, India
im = Image.new("RGB", (W, H), (17, 15, 13)); d = ImageDraw.Draw(im); head(d)
tracked(d, M + 4, 230, "WATCHING FROM INDIA?", MB(24), YEL)
y = stack(d, M, 290, ["INDIA ISN'T ON", "AMAZON'S LIST."], 132, [CREAM, YEL])
items = [("CATCH UP ON SEASONS 1-5", "Netflix (Hindi audio listed), Lionsgate+ on Prime Video, or free in The Chosen app."),
         ("SEASON 6, EPISODE 1", "Churches can still screen it free, until 15 November."),
         ("THE FREE APP", "Season 6 lands after Amazon's 90-day window. Our estimate: early March 2027.")]
y += 30
for a, b in items:
    tracked(d, M, y, a, MB(26), YEL); y += 46
    y = para(d, M, y, b, M5(37), CREAM, 42, 1.32) + 44
foot(d, 3); im.save(OUT + "slide-3.jpg", quality=92)

# 4 - key art detail, the finale
im = scrim(cover((0.12, 0.34, 0.88, 0.76)), bot_y=380, bot_a=252); d = ImageDraw.Draw(im); head(d)
tracked(d, M + 4, 600, "THE PART MOST PEOPLE MISS", MB(23), YEL)
y = stack(d, M, 650, ["THE FINALE", "DOESN'T STREAM."], 120, [CREAM, YEL])
y = para(d, M, y + 20, "Season 6 ends in cinemas on 12 March 2027. The resurrection season follows on 31 March 2028.", M5(31), CREAM, 50)
foot(d, 4, credit=CRED); im.save(OUT + "slide-4.jpg", quality=92)

# 5 - dark card, Roumie + CTA
im = Image.new("RGB", (W, H), (17, 15, 13)); d = ImageDraw.Draw(im); head(d)
tracked(d, M + 4, 230, "WHAT JONATHAN ROUMIE DOES NEXT", MB(23), YEL)
y = stack(d, M, 300, ["HE'S NARRATING", "A CATHEDRAL."], 140, [CREAM, YEL])
y = para(d, M, y + 26, "Roumie voices LUMINISCENCE, an immersive show inside St. Patrick's Cathedral, New York, running through mid-November.", M5(37), CREAM, 42)
y = para(d, M, y + 30, "Will you watch on 15 November, or wait for the app? Tell us in the comments.", MB(36), CREAM, 42)
para(d, M, y + 30, "Full guide: link in bio", M5(30), GREY, 60)
foot(d, 5); im.save(OUT + "slide-5.jpg", quality=92)

ims = [Image.open(OUT + f"slide-{i}.jpg") for i in range(1, N + 1)]
c = Image.new("RGB", (360 * N + 20 * (N - 1), 450), (20, 20, 20))
for i, x in enumerate(ims): c.paste(x.resize((360, 450)), (i * 380, 0))
c.save(OUT + "contact.png"); print("ok")
