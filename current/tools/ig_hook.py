"""5Talents IG hook card, 1440x1920 (3:4), feature image + hook. Matches the Giants/Peggy cards."""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

D = "/tmp/claude-0/ig/"
W, H = 1440, 1920
PURPLE = (139, 92, 246); CYAN = (94, 224, 232); INK = (10, 10, 10)
F = lambda n, s: ImageFont.truetype(D + n + ".ttf", s)

SECTION = "CULTURE"
HEAD = "She left school so her youngest sister could stay in. Now she runs the sound desk."
SUB = "Sixteen channels, and Esther is the only woman on the crew."
PHOTO = sys.argv[1]
OUT = sys.argv[2]

def vgrad(w, h, top, bot):
    t = np.linspace(0, 1, h)[:, None, None]
    a = np.array(top)[None, None, :] * (1 - t) + np.array(bot)[None, None, :] * t
    return Image.fromarray(np.repeat(a, w, 1).astype(np.uint8))

def hgrad(w, h, a, b):
    t = np.linspace(0, 1, w)[None, :, None]
    g = np.array(a)[None, None, :] * (1 - t) + np.array(b)[None, None, :] * t
    return Image.fromarray(np.repeat(g, h, 0).astype(np.uint8))

def tracked(d, x, y, s, f, fill, tr):
    for c in s:
        d.text((x, y), c, font=f, fill=fill); x += d.textlength(c, font=f) + tr
def twidth(d, s, f, tr): return sum(d.textlength(c, font=f) + tr for c in s) - tr

def wrap(d, text, f, maxw, tr=0):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if twidth(d, t, f, tr) <= maxw: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

img = Image.new("RGB", (W, H), (255, 255, 255))
BAR = 30; L = 130; R = W - 80

# --- photo block (bottom), faded into white at top
ph = Image.open(PHOTO).convert("RGB")
ph = ImageEnhance.Color(ph).enhance(1.05)
pw = W - BAR
scale = pw / ph.width
ph = ph.resize((pw, int(ph.height * scale)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
CROP = 70; ph = ph.crop((0, 0, ph.width, ph.height - CROP)); PH_TOP = H - ph.height
FADE = 230
mask = Image.new("L", ph.size, 255)
m = np.array(mask, np.float32)
ramp = np.clip(np.linspace(0, 1, FADE), 0, 1) ** 1.6
m[:FADE, :] = (ramp * 255)[:, None]
img.paste(ph, (BAR, PH_TOP), Image.fromarray(m.astype(np.uint8)))

d = ImageDraw.Draw(img)
# --- left gradient bar
img.paste(vgrad(BAR, H, PURPLE, CYAN), (0, 0))

# --- header
B = F("bebas", 128)
d.text((L, 118), "5TALENTS", font=B, fill=INK)
lab = F("pop700", 38); lw = twidth(d, SECTION, lab, 6)
lx = L + d.textlength("5TALENTS", font=B) + 34
d.line([(lx, 186), (R - lw - 34, 186)], fill=INK, width=4)
tracked(d, R - lw, 164, SECTION, lab, INK, 6)

# --- headline (tight, heavy)
hf = F("inter800", 84); tr = -3.4
y = 300
for line in wrap(d, HEAD, hf, R - L, tr):
    tracked(d, L, y, line, hf, INK, tr); y += 92
# --- subtitle
y += 34
sf = F("noto400", 50)
for line in wrap(d, SUB, sf, R - L):
    d.text((L, y), line, font=sf, fill=INK); y += 64
TEXT_END = y
print("text ends", TEXT_END, "photo top", PH_TOP, "fade ends", PH_TOP + FADE)

# --- footer URL in gradient on a white pill so it reads over the photo
uf = F("pop700", 52); url = "5talentsmag.com"
uw = int(d.textlength(url, font=uf)); ux, uy = L, H - 150
pad = 26
pill = Image.new("RGBA", (uw + pad * 2, 90), (0, 0, 0, 0))
ImageDraw.Draw(pill).rounded_rectangle([0, 0, pill.width - 1, pill.height - 1], 45, fill=(255, 255, 255, 235))
img.paste(pill, (ux - pad, uy - 14), pill)
tm = Image.new("L", (uw + 4, 80), 0); ImageDraw.Draw(tm).text((0, 0), url, font=uf, fill=255)
img.paste(hgrad(uw + 4, 80, PURPLE, CYAN), (ux, uy), tm)

img.save(OUT, quality=94)
