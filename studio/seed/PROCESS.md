# Converting an issue

The repeatable loop. Six steps, one issue at a time.

Text for all eighteen issues is already extracted in `seed/extracted/`, so
step 1 is only needed when you want the photographs out of a specific issue.

---

## 1. Get the images out (optional)

```bash
cd studio
npm run extract -- "../5Talents Magazine - August 2013 Issue.pdf" august-2013
```

Writes `seed/extracted/images/august-2013/`. Roughly half of what survives the
size filter is background texture rather than photography — sort it by eye.
Requires `brew install poppler`.

## 2. Read the contents page

`seed/extracted/layout/<slug>.txt`, page 2 or 3. Layout mode keeps the
contents grid readable where the default mode scrambles it.

## 3. Triage every piece

Add a row per piece to `articles/TRIAGE.md` before writing anything. Four
verdicts: **publish**, **check rights**, **out of scope**, **skip**. The
questions that decide it:

- **Is it ours?** GotQuestions.org supplied roughly one piece per issue through
  the first year, sometimes credited and sometimes not. Movie-review synopses
  look lifted from distributor copy. Neither is yours to republish.
- **Is the writer reachable?** From mid-2013 the magazine ran guest
  contributors. Set `author.republishConsent` per person before their work goes
  back up — a short email offering a byline link usually does it, and often
  reopens the relationship.
- **Is it in scope?** The 2026 scope statement rules out persecution, caste,
  church–society controversy and politics. Some good archive material fails
  this. `TRIAGE.md` works the Graham Staines piece through as the example.
- **Is it worth a reader's time in 2026?** A 2011 film review is not.

## 4. Clean the text

Copy `seed/articles/july-2012.json` as the template and work from
`seed/extracted/<slug>.txt`.

What actually needs doing, in the order it bites:

- **Reading order.** Two-column spreads interleave line by line. A question
  from the right column lands inside the answer from the left. Always check the
  rendered page, never trust the extraction alone.
- **Mid-word column breaks.** Where a photograph sits between two columns, the
  extractor splits words across it — `Stai/nes`, `lan/guage`, `w/hom`. Worst
  case in the archive so far; budget real time for those pages.
- **Question order.** Interviews often have the opening greeting set at the
  foot of the first column, so it extracts third. Restore the order they were
  asked in.
- **Typos.** Fix them in the magazine's own text — intros, headings, standfirsts.
  Leave the interviewee's phrasing alone; it is their voice, and "we are lacking
  to know His will" is how they said it. Record what you did in
  `archiveMeta.editNote`, which renders to readers.
- **Headline.** The print headline was often just a name. Web headlines have to
  earn a click and survive a search result. A direct quote from the piece is
  the safest rewrite.
- **One pull quote.** No more. The brush highlight is a highlighter — used
  twice it reads as emphasis, five times as a novelty theme.

## 5. Import

```bash
npm run import july-2012      # one issue
npm run import                # everything in seed/articles/
```

Creates the authors and tags, uploads the hero images, creates the articles,
and links each one into the issue's contents so `/archive/<issue>` points at
the web version. Idempotent — run it as many times as you like.

**Nothing imports unless `archiveMeta.rightsCleared` is set to `full` or
`textOnly`.** That is a hard gate, not a note, for the same reason
`sponsorTier` drives the disclosure label automatically: a check that relies on
someone remembering will eventually be forgotten. `--force` overrides it for
one run, deliberately.

## 6. Check it on a phone

Not a desktop browser narrowed to phone width. A real Android over mobile data
is the reader you are actually publishing for.

---

## What one issue costs

Measured on July 2012, not estimated:

| | |
|---|---|
| Pieces in the issue | 7 |
| Publishable after triage | 2 |
| Words cleaned | 1,563 |
| Hero images recovered | 2 of 3 wanted |

The blueprint budgeted 15–25 minutes per article across ~100 articles. On this
issue the clean interviews sat at the low end of that; the Staines page, with
words broken across a photograph, would have run well past the top of it.

The number that actually moves the estimate is the **triage rate**. Two of
seven pieces cleared. If that holds across the archive, the ~100–135 article
figure in blueprint section 1 is nearer **40–60 republishable articles** — and
the total cleanup lands well under the 25–40 hours budgeted, because most of
the work turns out to be deciding rather than typing.

Do not extrapolate from one issue, though. Issue 1 was thin on original
long-form and heavy on syndicated filler. The 2013 issues carry more guest
writing, which raises the article count and the consent workload together.
Convert August 2013 next and compare — two data points from different eras
will tell you far more than one.

---

## Image resolution, honestly

The photographs were placed at web resolution in 2012. The Samuel Stanley Jones
portrait is 561 × 444; Mary Sujani is 559 × 419. Both are landscape, and both
are small.

Measured on the live homepage, this is what that means per shape:

| Shape | Ratio | Upscale from a 560×420 source | Verdict |
|---|---|---|---|
| Compact | 3:2 | ×1.14 | fine |
| Standard | 5:4 | ×1.2 | fine |
| Feature | 16:10 | ×1.5 | acceptable as a section lead |
| **Portrait hero** | **3:4** | **×1.8** | **visibly soft — don't** |

A 3:4 crop of a 560×420 landscape leaves about 314 × 419 real pixels against a
slot that renders near 360 × 480. Sanity will not invent the rest.

So the homepage hero query only pulls articles an editor has explicitly set to
`featured: hero` or `featured`. Archive pieces stay in the 5:4 and 3:2 shapes,
which sit close to their native ratio and need almost no upscaling. The hero is
where new photography goes — and per the design system, that means one person,
looking at the camera, filling the frame.

### Always set the hotspot

The hero card sets its headline over the photograph, in the lower-middle, so
the subject's face reads above it. That only works if the crop puts the face in
the upper third.

Sanity centre-crops by default, which on a landscape source drops the face
straight behind the headline. **Open the image in the Studio and drag the
hotspot onto the face** — it takes two seconds and it is the difference between
a cover and a mess. Both July 2012 pieces have theirs set already; use them as
the reference.

Shoot new hero photography **portrait**, with the subject's head in the top
third and dead space below it for the type. Every one of Relevant's lead
photographs is framed that way, and it is why their headlines never collide
with a face.

## The Missionary Story column

Do not convert a piece from this column without reading `MISSIONARY-STORIES.md`
first. Three of them were copied text, the 2012 framing is wrong for India in
2026, and that document holds both the rewrite structure and the checklist.
