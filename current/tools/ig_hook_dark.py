"""5Talents IG hook card, dark-panel variant (Relevant-style): full-bleed photo on top,
black text panel below. 1440x1920 (3:4). Usage: hook_dark.py PHOTO OUT [focus_y 0-1]"""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

D = "/tmp/claude-0/ig/"
W, H = 1440, 1920
PURPLE = (139, 92, 246); CYAN = (94, 224, 232); PANEL = (18, 17, 16); WHITE = (255, 255, 255)
F = lambda n, s: ImageFont.truetype(D + n + ".ttf", s)

SECTION = "HERITAGE"
HEAD = "He fed two thousand children a day and never once asked anyone for money"
SUB = ("A thief at ten. A fraud at twenty. Then sixty years of orphanages in Bristol, "
       "funded entirely by donations he refused to solicit.")
PHOTO, OUT = sys.argv[1], sys.argv[2]
FOCUS = float(sys.argv[3]) if len(sys.argv) > 3 else 0.3
GRAYSCALE = True   # 19th-century photographs: keep them monochrome

def grad(w, h, a, b, vertical):
    n = h if vertical else w
    t = np.linspace(0, 1, n)
    g = np.array(a)[None, :] * (1 - t[:, None]) + np.array(b)[None, :] * t[:, None]
    arr = np.repeat(g[:, None, :], w, 1) if vertical else np.repeat(g[None, :, :], h, 0)
    return Image.fromarray(arr.astype(np.uint8))

def tracked(d, x, y, s, f, fill, tr):
    for c in s:
        d.text((x, y), c, font=f, fill=fill); x += d.textlength(c, font=f) + tr
def tw(d, s, f, tr): return sum(d.textlength(c, font=f) + tr for c in s) - tr
def wrap(d, text, f, maxw, tr=0):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if tw(d, t, f, tr) <= maxw: cur = t
        else: lines.append(cur); cur = w
    return lines + [cur]

BAR = 30; L = 110; R = W - 90
img = Image.new("RGB", (W, H), PANEL)
d = ImageDraw.Draw(img)

# --- measure text panel first so the photo takes whatever is left
hf = F("inter800", 80); htr = -2.6; hlh = 90
sf = F("noto400", 44); slh = 60
hl = wrap(d, HEAD, hf, R - L, htr); sl = wrap(d, SUB, sf, R - L)
url_h = 150
panel_h = 90 + len(hl) * hlh + 40 + len(sl) * slh + url_h
PH = H - panel_h

# --- photo, cover-cropped into the top block
ph = Image.open(PHOTO).convert("RGB")
if GRAYSCALE: ph = ImageOps.grayscale(ph).convert("RGB")
pw = W - BAR
s = max(pw / ph.width, PH / ph.height)
ph = ph.resize((int(ph.width * s) + 1, int(ph.height * s) + 1), Image.LANCZOS)
top = int((ph.height - PH) * FOCUS); left = (ph.width - pw) // 2
ph = ph.crop((left, top, left + pw, top + PH)).filter(ImageFilter.UnsharpMask(2, 50, 2))
img.paste(ph, (BAR, 0))
# darken the top so the header reads, and the seam into the panel
sh = np.zeros((PH, pw), np.float32)
y = np.arange(PH)[:, None]
sh += np.clip(1 - y / 320, 0, 1) ** 1.5 * 150
sh += np.clip((y - (PH - 260)) / 260, 0, 1) ** 1.4 * 255
ov = Image.new("RGB", (pw, PH), PANEL)
img.paste(ov, (BAR, 0), Image.fromarray(np.clip(sh, 0, 255).astype(np.uint8)))

d = ImageDraw.Draw(img)
img.paste(grad(BAR, H, PURPLE, CYAN, True), (0, 0))

# --- header over the photo
B = F("bebas", 112)
d.text((L, 70), "5TALENTS", font=B, fill=WHITE)
lab = F("pop700", 32); lw = tw(d, SECTION, lab, 6)
lx = L + d.textlength("5TALENTS", font=B) + 30
d.line([(lx, 130), (R - lw - 30, 130)], fill=WHITE, width=3)
tracked(d, R - lw, 111, SECTION, lab, WHITE, 6)

# --- text panel
y = PH + 30
for line in hl:
    tracked(d, L, y, line, hf, WHITE, htr); y += hlh
y += 40
for line in sl:
    d.text((L, y), line, font=sf, fill=(205, 202, 196)); y += slh

uf = F("pop700", 46); url = "5talentsmag.com"
uw = int(d.textlength(url, font=uf)) + 4
m = Image.new("L", (uw, 70), 0); ImageDraw.Draw(m).text((0, 0), url, font=uf, fill=255)
img.paste(grad(uw, 70, PURPLE, CYAN, False), (L, H - 120), m)
cr = F("noto400", 26); ct = "Photo: public domain"
d.text((R - d.textlength(ct, font=cr), H - 105), ct, font=cr, fill=(120, 118, 112))

img.save(OUT, quality=94)
print("photo block", PH, "px tall; panel", panel_h)
