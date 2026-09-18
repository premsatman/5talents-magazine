# Build spec — the `/current` section for daily posts

Written 17 Sep 2026, against the code as it stands. Companion to
`daily-posts-traffic-plan.md` and the Notion page *Daily posts — Week 1*.

---

## Good news first

I said last time this was a blocking build. Having read the code, it is much
smaller than that. `web/src/app/[section]/page.tsx` already renders any section
generically, `section` is already a Sanity document type, and `sitemap.ts`
already walks `SECTION_SLUGS`. Most of a new section is two lines and a Studio
document.

The real work is not the route. It is **stopping five short posts a week from
eating the homepage**, and **making the image-rights discipline something the
CMS enforces instead of something we have to remember.**

---

## 1. The shape: one section, four tags, one new kind

Three things were candidates for carrying the franchises. Only one combination
works.

**Section — one new one, `current`.** Not four. FINDINGS, THEN & NOW, SAID and
REMEMBER WHEN as four top-level sections would double the nav and bury Faith,
Culture and Heritage, which are the magazine.

**Franchises — tags.** `/tags/[tag]` already exists with a listing page and
`SECTION_TAGS_QUERY` already surfaces a section's tags. Four tags — `witness`,
`findings`, `then-and-now`, `remember-when` — cost nothing, and
`/tags/then-and-now` becomes a real landing page for the franchise that is ours
alone.

**Form — one new `kind` value, `brief`.** Not for display; for filtering.
`cardFragment` already projects `kind`, so every query can exclude briefs
without a schema change, and that turns out to matter a lot (§3).

> **Naming decision for Premasis.** The plan suggested `witness` as the section
> name. Having laid it out, `current` is better: WITNESS is a franchise, and a
> section called Witness containing REMEMBER WHEN reads wrong. `current` is
> generic, understood, and not claimed by anything. Neither `current` nor
> `witness` collides with `RESERVED_SLUGS`. Your call.

---

## 2. The route — three small changes

### 2a. `web/src/lib/sections.ts`

```ts
export const SECTION_SLUGS = [
  'faith',
  'culture',
  'technology',
  'work-money',
  'wellbeing',
  'campus',
  'heritage',
  'current',        // daily stream — see readme/CURRENT-SECTION-SPEC.md
] as const
```

That is the whole route change. `generateStaticParams`, `dynamicParams = false`,
the 404 guard and the sitemap all read from this constant.

### 2b. Create the Section document in Studio

| Field | Value |
|---|---|
| name | Current |
| slug | `current` |
| description | Short daily posts — research, viral faith moments, and the archive checked against now. |
| ordering | `99` — last in the nav, so it never outranks the magazine sections |

### 2c. Nothing else

`sitemap.ts` picks it up from `SECTION_SLUGS` automatically, and article URLs
under it come through `SITEMAP_QUERY` with no change.

---

## 3. The part that actually matters — keeping briefs off the homepage

`HOME_LATEST_QUERY` is currently:

```groq
*[${live} && featured != "hero"] | order(publishedAt desc)[0...5]{ ${cardFragment} }
```

Five posts a week, ordered by `publishedAt desc`, **will occupy all five slots
within one week** and the features will never appear again. Same risk in every
other recency-ordered query.

### 3a. Exclude briefs from the main latest rail

```groq
export const HOME_LATEST_QUERY = defineQuery(/* groq */ `
  *[${live} && featured != "hero" && kind != "brief"] | order(publishedAt desc)[0...5]{
    ${cardFragment}
  }
`)
```

Use `kind != "brief"` and not `section->slug.current != "current"` — the kind is
the thing we mean, and it keeps working if the section is ever renamed.

### 3b. Give briefs their own rail instead

```groq
export const HOME_BRIEFS_QUERY = defineQuery(/* groq */ `
  *[${live} && kind == "brief"] | order(publishedAt desc)[0...6]{
    ${cardFragment},
    "franchise": tags[0]->{ name, "slug": slug.current }
  }
`)
```

A compact six-item strip, headline-led, no big images — it should read as a
ticker next to the features, not compete with them.

### 3c. Audit every other recency query before shipping

`HOME_COMPACT_QUERY`, `HOME_TAIL_QUERY`, `HOME_RAIL_QUERY`,
`ARTICLE_FALLBACK_RELATED_QUERY` and `SEARCH_QUERY` all order by recency.
Decide brief-in or brief-out for each. Default to **out** everywhere except
search and the section page.

### 3d. RSS — leave briefs in

RELEVANT's feed carries both, and their feed is how the cadence was measured.
No change to `rss.xml/route.ts`.

---

## 4. Schema changes

### 4a. `studio/schemaTypes/article.ts` — add the kind

```ts
options: {
  list: [
    { title: 'Feature', value: 'feature' },
    { title: 'Interview', value: 'interview' },
    { title: 'Review', value: 'review' },
    { title: 'Essay', value: 'essay' },
    { title: 'Brief — daily post', value: 'brief' },
  ],
  layout: 'radio',
},
```

### 4b. Block briefs from the numbered issues

The ISSN application claims monthly frequency. A brief must never carry an
`onlineIssue`, or the daily stream starts appearing inside numbered issues and
the frequency claim stops being true. Add to the `onlineIssue` field:

```ts
hidden: ({ document }) => document?.kind === 'brief',
validation: (r) =>
  r.custom((value, ctx) => {
    const kind = (ctx.document as { kind?: string } | undefined)?.kind
    if (kind === 'brief' && value) {
      return 'Briefs stay outside the numbered issues — the ISSN frequency claim depends on it.'
    }
    return true
  }),
```

### 4c. `briefMeta` — the source link, enforced

Deliberately minimal. A five-checkbox verification form would be more thorough
and would kill the cadence by week two; the checklist lives in the plan, and
what the schema enforces is the one thing that must never be missing.

```ts
defineField({
  name: 'briefMeta',
  title: 'Brief',
  type: 'object',
  group: 'kindMeta',
  hidden: ({ parent }) => parent?.kind !== 'brief',
  fields: [
    defineField({
      name: 'sourceUrl',
      title: 'Primary source',
      type: 'url',
      description:
        'The report, the newsroom, the original upload. One link. If there is no source that can be named, there is no brief.',
    }),
    defineField({ name: 'sourceName', type: 'string', title: 'Source name' }),
    defineField({
      name: 'verifiedNote',
      type: 'text',
      rows: 2,
      title: 'What was checked',
      description:
        'One line for our own record: who covered it, whether the people and place are named, anything that did not check out.',
    }),
  ],
  options: { collapsible: true, collapsed: false },
}),
```

Then make it required at the document level:

```ts
// on the `body` field, or as a document-level validation
validation: (r) =>
  r.custom((_, ctx) => {
    const doc = ctx.document as { kind?: string; briefMeta?: { sourceUrl?: string } } | undefined
    if (doc?.kind === 'brief' && !doc?.briefMeta?.sourceUrl) {
      return 'A brief needs a primary source link.'
    }
    return true
  }),
```

### 4d. Image rights — make the CMS ask the question

This is the one I would not skip. We established that credit is not a licence
and that wire photos are the standing trap on the WITNESS beat. A `credit`
string does not capture *why* we may use a picture, so it cannot stop the
mistake. This does.

Add to the `hero` field's inline `fields` array, next to `credit`:

```ts
defineField({
  name: 'rightsBasis',
  title: 'Why we may use this image',
  type: 'string',
  description:
    'Credit is not permission. Every image needs a basis, and "found it online" is not one.',
  options: {
    list: [
      { title: 'Ours — we made it, or it is from our own archive', value: 'owned' },
      { title: 'Licensed stock — Adobe, Envato, paid', value: 'licensed' },
      { title: 'Free licence — Unsplash, Pexels', value: 'free' },
      { title: 'Creative Commons — credit is required by the licence', value: 'cc' },
      { title: 'Written permission from the rights holder', value: 'permission' },
      { title: 'Public domain', value: 'publicDomain' },
      { title: 'AI generated', value: 'generated' },
    ],
  },
}),
defineField({
  name: 'rightsNote',
  title: 'Where the permission lives',
  type: 'string',
  description:
    'For CC: the licence and the attribution string. For permission: where the reply is saved — "DM from @handle, 12 Sep 2026". For stock: the licence or order number.',
  hidden: ({ parent }) => !['cc', 'permission', 'licensed'].includes(parent?.rightsBasis ?? ''),
  validation: (r) =>
    r.custom((value, ctx) => {
      const basis = (ctx.parent as { rightsBasis?: string } | undefined)?.rightsBasis
      if (['cc', 'permission', 'licensed'].includes(basis ?? '') && !value) {
        return 'Say where the permission is recorded. In six months nobody will remember.'
      }
      return true
    }),
}),
```

Mirror both onto `externalImage.ts`, or the Cloudinary path becomes the hole in
the net.

`rightsBasis` is intentionally *not* `required()` — that would block every
existing article on the next save. Make it required later, once the back
catalogue is filled in.

---

## 5. Front end

### 5a. Card label

`Card.tsx` already takes `showSection`. On the `/current` page every card would
read CURRENT, which is useless. Pass the franchise tag instead:

```tsx
<Card
  key={article._id}
  article={article}
  showSection={false}
  label={article.franchise?.name}   // WITNESS / FINDINGS / THEN & NOW
/>
```

Add an optional `label?: string` to `ArticleCardData` in `components/types.ts`
and render it where the section label renders now.

### 5b. The section page needs a different layout

`[section]/page.tsx` sends the first three articles to `HeroSync` — three large
overlay cards sharing one photograph. That is built for features with strong
lead images. Briefs will often have no photograph at all (§4d, and the
typographic-card route in the plan).

Branch on the section:

```tsx
const isStream = section === 'current'
// isStream: skip HeroSync entirely, render every article through the
// grid-cards list, headline-first, image optional.
```

### 5c. Build the typographic card

Not code — a Canva template. Masthead, franchise label, big headline, no
photograph. It is the permanent answer to the rights problem and it becomes a
recognisable house style. Build it before day one, not after the first post
that has no usable picture.

---

## 6. Order of work

> **Status, 18 Sep 2026.** Steps 1, 3, 4, 6, 7 and 8 are done in the repo and
> `tsc --noEmit` passes. Outstanding: the Studio documents (2 and 5), typegen,
> the GA4 key event (9) and the Canva template (10).


1. `sections.ts` — add `current`
2. Create the Section document in Studio
3. `article.ts` — add `kind: 'brief'`, the `onlineIssue` guard, `briefMeta`
4. `hero` / `externalImage` — `rightsBasis` and `rightsNote`
5. Create the four franchise tags in Studio
6. `HOME_LATEST_QUERY` — exclude briefs; add `HOME_BRIEFS_QUERY`
7. Audit the other recency queries (§3c)
8. `Card.tsx` label, `[section]/page.tsx` stream branch
9. Set the newsletter signup as a GA4 key event — **still outstanding, and
   without it none of this is measurable**
10. Canva typographic template

Steps 1–5 are enough to publish Monday's post. 6–8 can follow the same week.

## 7. Run locally, not from a cloud session

Typegen and `next build` cannot run from here — they need the local toolchain.
After the schema edits:

```bash
cd studio && npx sanity schema extract
cd ../web && npx sanity typegen generate
npx tsc --noEmit
npm run build
```

`types.generated.ts` will be stale until `typegen` runs, and every new query
will type as `unknown` in the meantime.
