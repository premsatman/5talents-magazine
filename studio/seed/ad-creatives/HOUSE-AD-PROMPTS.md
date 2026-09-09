# House ad creatives: prompts and specs

For Premasis, 3 September 2026. Copy the prompts below into ChatGPT, Midjourney
or any image generator. Read the warning first, because it decides how you use
them.

---

## Read this before you generate anything

**Image generators cannot produce these files directly.** Three reasons, and all
three matter.

**1. They cannot output your sizes.** ChatGPT returns squares and two rectangles
(1024×1024, 1024×1536, 1536×1024). None of them is 336×280, 300×600 or 970×90.
Everything has to be cropped or resized afterwards.

**2. They cannot spell reliably.** Small type in a generated image comes out
mangled, misspelled or invented. At the sizes here the type is small. Assume any
words in the output are wrong until you have read every letter.

**3. 970×90 is impossible for them.** That is a ratio of nearly 11 to 1. No
consumer image model will generate it, and cropping a square down to a 90px
strip throws away 90% of the picture. **Do not try. Make this one in Canva.**

**So use them like this.** Generate the artwork and the mood. Then set the real
text in Canva, Figma or even PowerPoint, where you control the spelling, the font
and the exact pixel size. The generator gives you a background; you give it words.

---

## The brand values, so every prompt is consistent

| | |
|---|---|
| Brand yellow | **#FDEF0A** — the highlight sampled from the original printed logo |
| Ink | **#14130E** — a warm near-black. Never pure black next to the yellow, it reads harsh |
| Paper | **#FDFCF7** — warm off-white, not pure white |
| Muted line | **#E6E3D8** |
| Feel | Editorial, warm, Indian, uncluttered. A magazine, not a church flyer |

**One rule that matters more than the colours:** the yellow is a highlighter, not
a background. In the design it sits behind a few words like a brush stroke. An ad
that is 80% yellow will look nothing like the site.

---

## Export sizes

Design at **2×** and export at 2×. The site requests double-width images for
retina screens and a 1× file will look soft.

| Slot | Final size | Design and export at | Where it appears |
|---|---|---|---|
| B, C, E | 336 × 280 | **672 × 560** | Inside articles, text wraps beside it |
| D | 300 × 600 | **600 × 1200** | Article rail, sticky |
| F | 970 × 90 | **1940 × 180** | Between homepage sections |

Minimum type size: **14px at final size**, so 28px in the 2× file. Anything
smaller is unreadable on a phone.

Always put a solid background behind the whole banner. The site has a dark mode
and your image will not adapt to it. A transparent PNG that looks right on white
will float oddly on a dark page.

---

## PROMPT 1 — 336 × 280 (the one you will use most)

> Create a clean editorial advertisement banner, 672 × 560 pixels, for a
> Christian magazine.
>
> Layout: a book cover standing upright on the left third of the frame, casting a
> soft natural shadow. The right two thirds is empty warm off-white space for
> text to be added later. Leave that area genuinely clear.
>
> Colours: warm off-white background #FDFCF7. Deep warm near-black #14130E for
> any dark elements. One small accent in bright yellow #FDEF0A, used sparingly
> like a highlighter stroke, never as a large fill.
>
> Style: modern editorial design, generous white space, soft daylight, subtle
> paper texture. Feels like a well-designed magazine, not a church flyer or a
> stock advertisement. No gradients, no glow, no drop shadows on text, no
> clip-art crosses, no doves, no rays of light.
>
> Do not add any text, words or letters. I will set the type myself.

**Then in Canva**, on the empty right side, add: 4 to 6 words of benefit, then a
yellow button with 2 to 3 words on it. Not the subtitle. Not the author bio.

---

## PROMPT 2 — 300 × 600 (the tall rail unit)

> Create a tall vertical advertisement banner, 600 × 1200 pixels, for a Christian
> magazine.
>
> Layout: a book cover displayed large in the upper half, centred, standing at a
> slight angle with a soft natural shadow. The lower half is clear warm off-white
> space for text to be added later.
>
> Colours: warm off-white background #FDFCF7, deep warm near-black #14130E,
> one restrained accent of bright yellow #FDEF0A used like a highlighter stroke.
>
> Style: calm, confident, uncluttered editorial design with generous empty space.
> Soft natural light. Subtle paper grain. No gradients, no glow, no religious
> clip art.
>
> Do not add any text, words or letters.

**Then in Canva**, add: the title, one line underneath, and a button. Leave air
between them. A tall ad with white space reads as confident; a full one reads as
desperate.

---

## PROMPT 3 — 970 × 90

**Do not generate this one.** Build it in Canva at 1940 × 180 pixels:

- Book cover hard left, about 150px tall in the 2× file
- One short line of text, 36–40px, in #14130E
- A yellow #FDEF0A button hard right, about 70px tall
- Warm off-white #FDFCF7 background across the whole strip

One line of text. Not two. At 90 pixels tall there is no second line.

---

## The variant you asked for: with the size printed on it

Useful for reviewing layouts, for showing a designer what you need, and for a
media kit when you start selling. **Never upload these to the live site.**

Add this to the end of any prompt above:

> In the bottom right corner, place a small clean label reading exactly
> "336 x 280" in plain sans-serif type, dark grey, small, unobtrusive, as if it
> were a printer's specification mark. Draw a thin 2px dashed border in light
> grey around the entire outer edge of the image to show the exact ad boundary.

Change the numbers to match the size you are generating. Check the label letter
by letter when it comes back, because this is exactly the kind of small text
generators get wrong.

---

## A better route for the spec-sheet version

If what you want is a clear picture of the three sizes side by side at true
proportion, an image generator is the wrong tool. It will not get the ratios
right, which is the entire point of the exercise.

Ask me instead and I will produce them as exact PNGs, the way the existing dummy
creatives in this folder were made. Those are pixel-accurate because they were
drawn rather than generated.

---

## Checklist before uploading a finished creative

- [ ] Exported at 2× (672×560, 600×1200 or 1940×180)
- [ ] Every word spelled correctly, read letter by letter
- [ ] No text smaller than 28px in the 2× file
- [ ] Solid background, no transparency
- [ ] Looks right when you squint at it small, not just at full size
- [ ] Yellow used as an accent, not a background
- [ ] Alt text written: what the ad offers, not "book ad". The schema requires
      it, and it is what a screen reader and a search engine actually read
- [ ] Tier set to **House ad (our own services)** on the advertiser document
