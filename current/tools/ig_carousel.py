"""5Talents Instagram carousel generator. 1440x1920 (3:4), RELEVANT-style.
Slide kinds: cover, stat, quote, statement, cta. Brand: charcoal #171717, lemon #FFF21A,
lavender #A66BFF, violet-to-cyan spine, 5TALENTS — SECTION lockup."""
import json, sys, os, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts") + "/"
W, H = 1440, 1920
BAR = 30; L = 120; R = W - 100
PURPLE = (139, 92, 246); CYAN = (94, 224, 232)
DARK = (23, 23, 23); LEMON = (255, 242, 26); LAV = (166, 107, 255); WHITE = (255, 255, 255)
THEMES = {"dark": (DARK, WHITE, (190, 186, 178)), "lemon": (LEMON, DARK, (60, 58, 40)),
          "lav": (LAV, DARK, (40, 24, 70)), "white": ((250, 249, 245), DARK, (90, 88, 82))}
F = lambda n, s: ImageFont.truetype(FD + n + ".ttf", s)

def grad(w, h, a, b, vertical=True):
    n = h if vertical else w
    t = np.linspace(0, 1, n)[:, None]
    g = np.array(a) * (1 - t) + np.array(b) * t
    arr = np.repeat(g[:, None, :], w, 1) if vertical else np.repeat(g[None, :, :], h, 0)
    return Image.fromarray(arr.astype(np.uint8))

def tw(d, s, f, tr=0): return sum(d.textlength(c, font=f) + tr for c in s) - tr if tr else d.textlength(s, font=f)
def tracked(d, x, y, s, f, fill, tr):
    for c in s: d.text((x, y), c, font=f, fill=fill); x += d.textlength(c, font=f) + tr
def draw(d, x, y, s, f, fill, tr=0):
    tracked(d, x, y, s, f, fill, tr) if tr else d.text((x, y), s, font=f, fill=fill)
def wrap(d, text, f, maxw, tr=0):
    out = []
    for para in text.split("\n"):
        cur = ""
        for w in para.split():
            t = (cur + " " + w).strip()
            if tw(d, t, f, tr) <= maxw: cur = t
            else: out.append(cur); cur = w
        out.append(cur)
    return out
def block(d, x, y, text, f, fill, maxw, lh, tr=0):
    for line in wrap(d, text, f, maxw, tr):
        draw(d, x, y, line, f, fill, tr); y += lh
    return y
def fit(d, text, name, maxw, maxh, start, stop, lhk=1.1, tr_k=0.0):
    """largest size whose wrapped block fits maxw x maxh"""
    for s in range(start, stop, -2):
        f = F(name, s); tr = s * tr_k
        n = len(wrap(d, text, f, maxw, tr))
        if n * s * lhk <= maxh: return f, int(s * lhk), tr
    f = F(name, stop); return f, int(stop * lhk), stop * tr_k

def lockup(d, section, fg, y=78):
    B = F("bebas", 104); d.text((L, y), "5TALENTS", font=B, fill=fg)
    lab = F("pop700", 30); lw = tw(d, section, lab, 6)
    lx = L + d.textlength("5TALENTS", font=B) + 30
    d.line([(lx, y + 56), (R - lw - 30, y + 56)], fill=fg, width=3)
    tracked(d, R - lw, y + 39, section, lab, fg, 6)

def footer(d, n, total, fg, sub):
    f = F("pop600", 30)
    d.text((L, H - 112), f"{n}/{total}", font=f, fill=sub)
    t = "5talentsmag.com"; d.text((R - d.textlength(t, font=f), H - 112), t, font=f, fill=sub)

def spine(img): img.paste(grad(BAR, H, PURPLE, CYAN), (0, 0))

def cover(s, art, n, total):
    img = Image.new("RGB", (W, H), DARK); d = ImageDraw.Draw(img)
    hf, hlh, htr = fit(d, s["headline"], "inter800", R - L, 520, 92, 60, 1.12, -0.032)
    lines = wrap(d, s["headline"], hf, R - L, htr)
    panel = 70 + len(lines) * hlh + 230
    PH = H - panel
    ph = Image.open(art["src"]).convert("RGB")
    if art.get("crop"): ph = ph.crop(tuple(art["crop"]))
    pw = W - BAR; sc = max(pw / ph.width, PH / ph.height)
    ph = ph.resize((int(ph.width * sc) + 1, int(ph.height * sc) + 1), Image.LANCZOS)
    fx, fy = art.get("focus", [0.5, 0.4])
    left = int((ph.width - pw) * fx); top = int((ph.height - PH) * fy)
    ph = ph.crop((left, top, left + pw, top + PH))
    ph = ImageEnhance.Color(ph).enhance(1.04).filter(ImageFilter.UnsharpMask(2, 45, 2))
    img.paste(ph, (BAR, 0))
    y = np.arange(PH)[:, None].astype(np.float32)
    sh = np.clip(1 - y / 420, 0, 1) ** 1.3 * 215 + np.clip((y - (PH - 300)) / 300, 0, 1) ** 1.4 * 255
    img.paste(Image.new("RGB", (pw, PH), DARK), (BAR, 0),
              Image.fromarray(np.repeat(np.clip(sh, 0, 255).astype(np.uint8), pw, 1)))
    d = ImageDraw.Draw(img); spine(img)
    lockup(d, art["section"], WHITE)
    yy = PH + 40
    for line in lines: tracked(d, L, yy, line, hf, WHITE, htr); yy += hlh
    f = F("pop700", 30)
    x = tracked(d, L, H - 112, "SWIPE", f, LEMON, 5) or (L + tw(d, "SWIPE", f, 5) + 18)
    ay = H - 92; d.line([(x, ay), (x + 46, ay)], fill=LEMON, width=5); d.polygon([(x + 50, ay), (x + 34, ay - 12), (x + 34, ay + 12)], fill=LEMON)
    cr = F("noto400", 24); c = art.get("credit", "")
    d.text((R - d.textlength(c, font=cr), H - 106), c, font=cr, fill=(130, 126, 120))
    return img

def base(theme, section):
    bg, fg, sub = THEMES[theme]
    img = Image.new("RGB", (W, H), bg); d = ImageDraw.Draw(img); spine(img)
    lockup(d, section, fg); return img, d, fg, sub

def stat(s, art, n, total):
    img, d, fg, sub = base(s.get("theme", "dark"), art["section"])
    big = s["big"]; f = None
    for size in range(420, 120, -10):
        f = F("bebas", size)
        if d.textlength(big, font=f) <= R - L: break
    bb = d.textbbox((0, 0), big, font=f)
    bh = bb[3] - bb[1]
    lab = s.get("label"); body = s.get("text", "")
    bf, blh, _ = fit(d, body, "inter800", R - L, 560, 64, 44, 1.2, -0.02)
    blines = wrap(d, body, bf, R - L, -0.02 * bf.size)
    total_h = bh + 70 + len(blines) * blh
    y0 = max(300, (H - total_h) // 2 - 20)
    d.text((L - bb[0] - 4, y0 - bb[1]), big, font=f, fill=fg if s.get("theme") != "dark" else LEMON)
    y = y0 + bh + 70
    for line in blines: tracked(d, L, y, line, bf, fg, -0.02 * bf.size); y += blh
    if s.get("small"):
        y += 30; block(d, L, y, s["small"], F("noto400", 38), sub, R - L, 54)
    footer(d, n, total, fg, sub); return img

def quote(s, art, n, total):
    img, d, fg, sub = base(s.get("theme", "lemon"), art["section"])
    qf, qlh, qtr = fit(d, "“" + s["quote"] + "”", "inter800", R - L, 900, 124, 52, 1.16, -0.03)
    lines = wrap(d, "“" + s["quote"] + "”", qf, R - L, qtr)
    th = len(lines) * qlh + 140
    y = max(330, (H - th) // 2)
    for line in lines: tracked(d, L, y, line, qf, fg, qtr); y += qlh
    y += 50
    d.line([(L, y), (L + 90, y)], fill=fg, width=5); y += 34
    a = F("pop700", 36)
    block(d, L, y, s["who"].upper(), a, fg, R - L, 50, 3)
    if s.get("role"):
        y2 = y + 50 * len(wrap(d, s["who"].upper(), a, R - L, 3))
        block(d, L, y2 + 6, s["role"], F("noto400", 36), sub, R - L, 50)
    footer(d, n, total, fg, sub); return img

def statement(s, art, n, total):
    img, d, fg, sub = base(s.get("theme", "lav"), art["section"])
    hf, hlh, htr = fit(d, s["head"], "inter900", R - L, 640, 108, 64, 1.1, -0.035)
    hl = wrap(d, s["head"], hf, R - L, htr)
    bf = F("noto400", 46); bl = wrap(d, s.get("text", ""), bf, R - L) if s.get("text") else []
    th = len(hl) * hlh + (60 + len(bl) * 64 if bl else 0)
    y = max(320, (H - th) // 2 - 10)
    for line in hl: tracked(d, L, y, line, hf, fg, htr); y += hlh
    if bl:
        y += 60
        for line in bl: d.text((L, y), line, font=bf, fill=fg); y += 64
    footer(d, n, total, fg, sub); return img

def cta(s, art, n, total):
    img, d, fg, sub = base("dark", art["section"])
    k = F("pop700", 34); tracked(d, L, 520, "READ THE FULL STORY", k, LEMON, 6)
    hf, hlh, htr = fit(d, art["short"], "inter800", R - L, 520, 84, 56, 1.14, -0.03)
    y = 600
    for line in wrap(d, art["short"], hf, R - L, htr): tracked(d, L, y, line, hf, WHITE, htr); y += hlh
    y += 70
    # link pill
    uf = F("pop700", 46); url = "5talentsmag.com"
    uw = int(d.textlength(url, font=uf))
    d.rounded_rectangle([L, y, L + uw + 80, y + 104], 52, fill=WHITE)
    m = Image.new("L", (uw + 4, 70), 0); ImageDraw.Draw(m).text((0, 0), url, font=uf, fill=255)
    img.paste(grad(uw + 4, 70, PURPLE, (40, 170, 190), False), (L + 40, y + 20), m)
    y += 104 + 40
    d.text((L, y), "Link in bio  ·  " + art["path"], font=F("noto400", 34), fill=sub)
    f = F("pop700", 34)
    tracked(d, L, H - 330, "FOLLOW @5TALENTSMAG", f, WHITE, 5)
    d.text((L, H - 280), "Christian news, culture and stories, for a generation that scrolls.",
           font=F("noto400", 32), fill=sub)
    footer(d, n, total, WHITE, sub); return img

KINDS = {"cover": cover, "stat": stat, "quote": quote, "statement": statement, "cta": cta}

if __name__ == "__main__":
    data = json.load(open(sys.argv[1])); out = sys.argv[2]; only = sys.argv[3:] or None
    for art in data:
        if only and art["key"] not in only: continue
        slides = art["slides"] + [{"kind": "cta"}]
        os.makedirs(f"{out}/{art['key']}", exist_ok=True)
        for i, s in enumerate(slides, 1):
            im = KINDS[s["kind"]](s, art, i, len(slides))
            im.save(f"{out}/{art['key']}/slide-{i}.jpg", quality=93, progressive=True)
        print(art["key"], len(slides))
