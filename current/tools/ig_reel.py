"""Turn a carousel folder (slide-1..N.jpg, 1440x1920) into a 1080x1920 reel with music.
Usage: reel.py SLIDE_DIR MUSIC OUT.mp4 [music_start_s] [bpm]"""
import sys, glob, subprocess, numpy as np
from PIL import Image, ImageFilter, ImageDraw

d, music, out = sys.argv[1], sys.argv[2], sys.argv[3]
mstart = float(sys.argv[4]) if len(sys.argv) > 4 else 0
bpm = float(sys.argv[5]) if len(sys.argv) > 5 else 120
W, H, FPS = 1080, 1920, 30
CW, CH, CY = 1080, 1440, 240
LEMON = (255, 242, 26)
beat = 60 / bpm
files = sorted(glob.glob(d + "/slide-*.jpg"), key=lambda f: int(f.split("-")[-1][:-4]))
n = len(files)
mb = max(1, round(3.0 / beat)); eb = max(1, round(4.0 / beat))
beats = [eb] + [mb] * (n - 2) + [eb]
durs = [b * beat for b in beats]
starts = np.cumsum([0] + durs[:-1]); total = sum(durs)
T = 0.38  # transition length

cards = [Image.open(f).convert("RGB").resize((CW, CH), Image.LANCZOS) for f in files]
bgs = []
for c in cards:
    b = c.resize((W, int(W * CH / CW * 1.4)), Image.BILINEAR).crop((0, 0, W, H)) if False else c.resize((int(H * CW / CH), H), Image.BILINEAR)
    left = (b.width - W) // 2; b = b.crop((left, 0, left + W, H)).filter(ImageFilter.GaussianBlur(40))
    b = Image.blend(b, Image.new("RGB", (W, H), (12, 12, 12)), 0.55)
    bgs.append(b)

def ease(t): return t * t * (3 - 2 * t)

def card_at(i, local):
    """zoomed card i at local time"""
    k = 1.0 + 0.045 * min(local / durs[i], 1.0)
    w, h = int(CW * k), int(CH * k)
    z = cards[i].resize((w, h), Image.BILINEAR)
    l, t = (w - CW) // 2, (h - CH) // 2
    return z.crop((l, t, l + CW, t + CH))

def bars(dr, t):
    gap = 10; x0 = 40; tw = W - 80; seg = (tw - gap * (n - 1)) / n; y = 190
    for i in range(n):
        x = x0 + i * (seg + gap)
        dr.rounded_rectangle([x, y, x + seg, y + 8], 4, fill=(255, 255, 255, 90) if True else None)
        p = np.clip((t - starts[i]) / durs[i], 0, 1)
        if p > 0: dr.rounded_rectangle([x, y, x + seg * p, y + 8], 4, fill=LEMON)

proc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                         "-r", str(FPS), "-i", "-", "-ss", str(mstart), "-i", music,
                         "-filter_complex", f"[1:a]atrim=0:{total:.3f},afade=t=in:d=0.4,afade=t=out:st={total-1.6:.3f}:d=1.6[a]",
                         "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                         "-shortest", out], stdin=subprocess.PIPE)
nf = int(total * FPS)
for f in range(nf):
    t = f / FPS
    i = int(np.searchsorted(starts, t, side="right") - 1)
    local = t - starts[i]
    tr_left = starts[i] + durs[i] - t  # time to next boundary
    if i < n - 1 and tr_left < T:
        p = ease(1 - tr_left / T)
        frame = Image.blend(bgs[i], bgs[i + 1], p)
        a = card_at(i, local); b = card_at(i + 1, 0)
        off = int(W * p)
        frame.paste(a, (-off, CY)); frame.paste(b, (W - off, CY))
    else:
        frame = bgs[i].copy()
        # first slide: gentle rise-in
        if i == 0 and local < 0.5:
            p = ease(local / 0.5); c = card_at(0, local)
            frame.paste(Image.blend(Image.new("RGB", c.size, (12, 12, 12)), c, p), (0, CY + int(40 * (1 - p))))
        else:
            frame.paste(card_at(i, local), (0, CY))
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); bars(ImageDraw.Draw(ov), t)
    frame = Image.alpha_composite(frame.convert("RGBA"), ov).convert("RGB")
    proc.stdin.write(frame.tobytes())
proc.stdin.close(); proc.wait()
print("done", out, round(total, 2), "s")
