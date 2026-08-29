# 5Talents Magazine — 2026 relaunch

Built to the *5Talents Relaunch Blueprint* (27 Aug 2026) and the design system
v0.1 in the same folder.

```
web/      Next.js 16, App Router — the public magazine
studio/   Sanity Studio 6 — the editing environment
```

---

## Run it

Two terminals. Install once in each folder.

```bash
cd web    && npm install && npm run dev     # http://localhost:3000
cd studio && npm install && npm run dev     # http://localhost:3333
```

`web/.env.local` is already filled in with the real project ID and tokens.
The first `sanity dev` will ask you to log in.

---

## What is wired up

**Content model** — one `article` type with a `kind` discriminator, exactly as
section 7 specifies, because Sanity has no schema inheritance and three
document types would force every query to union across all of them. Plus
`author`, `section`, `tag`, `archiveIssue`, `advertiser`, `submission` and a
`siteSettings` singleton.

`readingTime` is derived at render, never stored — a stored value goes stale on
every edit.

**Routes** — every path from the blueprint, including RSS. `/[section]` is
constrained by an explicit allowlist in `web/src/lib/sections.ts` plus
`generateStaticParams` and `dynamicParams = false`, so a typo'd URL 404s
instead of generating soft-404s at scale.

**Disclosure** — `sponsorTier` drives the label automatically, above the
headline, before any content. Nobody has to remember it and nobody can remove
it. This is the single most important field in the schema.

**Ad slots** — all eight ship from day one, at the sizes and positions measured
off relevantmagazine.com. Their placement rule is simple enough to copy
wholesale: a 728×90 leaderboard immediately before every section heading and
nowhere else, plus a 300×600 in the rail. Every slot reserves its exact height
in every state. Slot A is off by default; see the warning below.

While unsold they render a labelled **“Space for ads — 728 × 90”** box. Set
`NEXT_PUBLIC_AD_PLACEHOLDERS="false"` for silent reserved space instead.

**Homepage layout** — structure adapted from Relevant, measured 28 Aug 2026:
three portrait hero cards, a five-across compact row beside a sticky rail, six
section blocks each pairing a 16:10 lead with a 2×2 grid, an archive strip and
a long tail. Card ratios are in `web/src/lib/media.ts` — one file, because
cards that drift apart in ratio are what makes a grid look homemade.

With the archive still being converted, `NEXT_PUBLIC_LAYOUT_PREVIEW="true"`
fills empty slots with labelled boxes at the right ratio so the grid is
judgeable. **Set it to `false` before anyone else sees the site.**

**Rendering** — the Live Content API. Pages render statically and are
invalidated by live events the moment a document changes: no polling, no
regenerating pages nobody edited, and editors see changes immediately. The
webhook at `/api/revalidate` is a fallback for invalidation from outside
Sanity.

**Type safety** — Sanity TypeGen reads every GROQ query and generates result
types from the deployed schema, so a query and its consumer cannot drift apart
silently. Regenerate with `npm run typegen` in `studio/`; it also runs
automatically during `sanity dev` and `sanity build`.

---

## Where this departs from the blueprint

**Standalone Studio, not embedded.** The blueprint did not specify, and Sanity's
current guidance is emphatic: a standalone Studio builds 10–30× faster, and it
**auto-updates** — it receives Sanity's bugfixes and new features with no
dependency bump and no redeploy. An embedded Studio ties every Studio update to
an app deploy. For a publication run in 10–20 hours a week, that maintenance
difference matters more than having one folder instead of two.

**Next.js 16, not 15.** 16 is the current stable release as of today, and
`next-sanity@13` requires it. Turbopack is now the default for dev and build.

**Supabase is absent**, as section 7 argued. Nothing here needs it.

---

## Seeding

The six sections and Site settings are **already in the dataset**. To load the
18 back issues with their covers:

```bash
cd studio && npm run seed
```

Safe to run repeatedly — it matches documents on slug and patches rather than
duplicating, and reuses a cover already in the asset store instead of
re-uploading it. Covers were rendered from page 1 of each PDF and live in
`studio/seed/covers/`; the issue metadata is in `studio/seed/issues.json`.

The PDFs themselves are deliberately *not* uploaded. 119 MB is the thing most
likely to push you past Sanity's free asset allowance (blueprint trigger 2).
The `pdfUrl` field on `archiveIssue` is there for the Cloudinary URLs.

## Converting the archive

```bash
cd studio && npm run import           # loads cleaned articles into Sanity
```

The full loop is in **`studio/seed/PROCESS.md`** — six steps, one issue at a
time, with the measured cost of the first one. Per-piece verdicts live in
`studio/seed/articles/TRIAGE.md`; cleaned copy lives in
`studio/seed/articles/<issue>.json`.

Text for all eighteen issues is already extracted to `studio/seed/extracted/`
in two modes, so you can read any issue without touching a PDF.

Nothing imports unless `archiveMeta.rightsCleared` is set — a hard gate, for
the same reason `sponsorTier` drives the disclosure label.

## Before you launch

**Add a contact address** in Site settings — it is the one seeded field left
blank, because the domain is not bought yet. Several pages fall back to a
placeholder until it is set.

**Set up the revalidation webhook** (optional — Live Content covers the common
case). In Sanity Manage → API → Webhooks:

| Field | Value |
|---|---|
| URL | `https://yoursite.com/api/revalidate` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["article","author","section","tag","archiveIssue","advertiser","siteSettings"]` |
| Projection | `{ "tags": [_type, _type + ":" + slug.current] }` |
| Secret | the `SANITY_REVALIDATE_SECRET` value in `web/.env.local` |

**Deploy the schema** so agent tooling and Sanity's own APIs can read it:

```bash
cd studio && npx sanity login && npx sanity schema deploy
```

Not required for the Studio to work — only for schema-aware tooling.

**Add production CORS** once you have a domain:

```bash
cd studio && npx sanity cors add https://5talentsmag.com --credentials
```

---

## Two corrections to the blueprint

Both found while rendering the covers, both from the issues themselves.

**There are 18 issues, not 17 — and 424 pages, not 400.** The blueprint's table
in section 1 omits **November 2013** (issue 14, Sheldon Bangera, 24pp). Its PDF
is in the *5Talents Magazines* folder but was never copied into this project
folder; the seed reads it from there. Worth copying across so both folders
agree.

**Issue 15 is missing entirely.** The printed numbering runs 1–14 to November
2013, then resumes at 16 for January 2014. Either a December 2013 issue exists
and you no longer have the file, or the numbering skipped. Either way the
archive has a hole in it, and it is worth knowing which before you tell anyone
the archive is complete.

Every archive figure downstream of section 1 — the ~100–135 article estimate,
the 25–40 hour cleanup budget, the asset-storage projection — is based on 17
issues and should be nudged up by one.

---

## Things the blueprint flagged that are now code

- **Slot A** is the main threat to Core Web Vitals. It is excluded from the
  default `enabledSlots`, and reserves 90px if you ever turn it on. At $3–8 RPM
  it earns little and costs ranking — consider leaving it off permanently.
- **Resend's daily cap** is roughly 100 sends, not the monthly 3,000, and that
  is the one likely to block a real newsletter. `/api/subscribe` is written and
  waiting for a key. **Test a broadcast to 150 dummy addresses before building
  anything around it.**
- **The pitch form** never exposes a write token. It posts to a server route
  with a honeypot, a per-IP rate limit and an optional Turnstile check.
  Submissions land as `submission` documents, so contributors never consume a
  Sanity seat.
- **Rights on archive material** are two separate questions, and the schema
  asks both: `author.republishConsent` for the writer, and
  `archiveMeta.rightsCleared` for the images, which may have been licensed for
  the print issue only.
- **Interview consent** — `interviewMeta.consentOnFile` records written consent
  and quote review. Section 8 makes this matter most where a piece touches
  conversion testimony.
- **The privacy page is placeholder text.** It describes what the site actually
  does, but it has not been near a lawyer. Section 9 budgets a legal
  consultation and calls it the one line not to cut.

---

## Still to do

1. **Test on a real Android device** before launch. It is your reader's screen,
   not a desktop browser narrowed to phone width.
2. **The archive conversion** — script the PDF text extraction, then budget
   25–40 hours for the manual cleanup across ~100 articles. Largest single work
   item in the plan. The `archiveIssue` schema and issue-browser page are ready
   to receive it.
3. **Redraw the wordmark as outlines.** It is set in Anton right now, which is
   fine for launch but leaves you identical to everyone else using Anton.
4. **Analytics** — GA4 from day one; ad networks verify sessions through it.
   Nothing is installed yet.
