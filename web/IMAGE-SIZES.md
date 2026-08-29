# Image sizes

Every size the site asks for, and what to upload so none of them upscale.

The single source of truth in code is `src/lib/media.ts`. Change it there, not
in the components.

---

## Two places a picture can live

**Uploaded to Sanity** — the *Lead image* field, and the image block in the
body. Sanity generates every crop and the hotspot decides what stays in frame.

**Hosted on Cloudinary** — the *Lead image from a URL* field, and the
“Image from a URL” block in the body. Paste the plain delivery URL and give the
width, height and alt text.

Either works everywhere; the site treats them identically. Where both are set
on the same article, the URL wins — pasting one is a deliberate act, and having
an old upload quietly override it would be the more surprising behaviour.

Cloudinary is worth using for photography. Blueprint trigger 2 identifies asset
storage as the likeliest reason to outgrow the Sanity free plan, and 119 MB of
issue PDFs plus covers is already close to it. Keeping pictures on Cloudinary
and only the text in Sanity buys a lot of headroom.

### What the site does to a Cloudinary URL

It rewrites it per slot rather than serving the original at full size:

```
c_fill,g_auto,w_800,h_640,f_auto,q_auto,dpr_2.0
```

`g_auto` is Cloudinary's auto-gravity — it finds the subject, which does the
same job as a Sanity hotspot without anyone having to set one. `f_auto` serves
AVIF or WebP where the browser takes it. **Paste the URL without transforms**;
if one is already in there the site replaces it.

---

## The short version

**Supply one photograph at 2400px on the long edge.** That covers every crop
below, whichever host it lives on.

Minimum that still works: **1400px wide** for anything that might lead an
article, because that is the threshold where the hero switches from headline-
over-image to headline-below. Under 1400 the piece still looks fine, it just
loses the overlay treatment.

---

## What each position requests

Requested widths are roughly 2× the rendered size, so the image stays sharp on
a retina screen.

| Position | Requested | Renders at | Ratio |
|---|---|---|---|
| **Article hero** — overlay | 2400 × 1200 | up to 1200 × 600 | 2:1 |
| **Article hero** — stacked | up to 2000 wide | capped at 1.3× the source | native |
| **Body image** | 1200 wide | up to 720 | native |
| **Homepage lead card** | 800 × 1066 | ~360 × 480 | 3:4 |
| **Section feature** | 1200 × 750 | ~600 × 375 | 16:10 |
| **Standard card** | 800 × 640 | ~290 × 232 | 5:4 |
| **Compact card** | 640 × 426 | ~220 × 146 | 3:2 |
| **Square** | 680 × 680 | ~340 | 1:1 |
| **List thumbnail** | 180 × 180 | 90 × 90 | 1:1 |
| **Author portrait** | 152 × 152 | 76 × 76 | 1:1 |
| **Archive cover** — homepage strip | 320 wide | 160 | ~3:4 |
| **Archive cover** — index | 400 wide | 200 | ~3:4 |
| **Archive cover** — issue page | 520 wide | 260 | ~3:4 |

The same photograph is cropped to several of these on one page, which is why
the hotspot matters more than the crop you upload.

---

## Shooting for it

The demanding shapes are the two portrait ones — the 3:4 homepage lead card and
the 2:1 article hero. Both put type over the picture.

- **Shoot portrait**, subject's head in the top third, dead space below it for
  the headline. Every lead photograph on a magazine front page is framed that
  way, and it is why their headlines never collide with a face.
- **One person, looking at the camera, filling the frame** — the design system's
  rule, and the thing the original covers got right.
- **Set the hotspot in the Studio.** Sanity centre-crops by default, which on a
  landscape source drops the face straight behind the headline. Dragging the
  hotspot onto the face takes two seconds.

## Why the archive photographs fall short

The 2012–14 shots were placed at web resolution: around 560 × 420. Measured
against the shapes above:

| Shape | Upscale from 560 × 420 | Verdict |
|---|---|---|
| Compact 3:2 | ×1.14 | fine |
| Standard 5:4 | ×1.2 | fine |
| Feature 16:10 | ×1.5 | acceptable as a section lead |
| Portrait hero 3:4 | ×1.8 | visibly soft |

So archive pieces are excluded from the 3:4 homepage lead automatically, and the
article hero falls back to the stacked layout on its own. Neither needs anyone
to remember a rule.

---

## Advertising

Ad creatives are requested at 2× the slot, so an advertiser should supply at
2× too. Sizes are in `src/lib/media.ts` under `AD_SIZES`:

970 × 250 billboard · 970 × 90 large leaderboard · 728 × 90 leaderboard ·
300 × 600 half page · 336 × 280 large rectangle · 300 × 250 · 600 × 150
newsletter · 160 × 600 skyscraper.
