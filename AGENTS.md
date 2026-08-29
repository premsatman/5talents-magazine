# Working in this repo

Two apps: `web/` (Next.js 16, App Router) and `studio/` (Sanity Studio 6).
They share one Sanity project: `wdzgdrz5`, dataset `production`.

## Rules that are easy to get wrong

**Stega.** Query results carry invisible Visual Editing characters. Any string
used for a comparison, an object key, an array membership test, a URL segment,
or a `<head>` tag MUST go through `clean()` from `@/sanity/stega` first, or it
will work in production and fail only inside the Presentation tool. Display
strings are passed through untouched so click-to-edit keeps working.
`generateMetadata` fetches with `stega: false`.

**Section slugs.** `web/src/lib/sections.ts` is the allowlist. A section added
in Sanity but not listed there will 404 — deliberately. Check `RESERVED_SLUGS`
before adding one: a section sharing a name with a static route silently
disappears behind it.

**Queries.** Add or edit GROQ in `web/src/sanity/queries.ts`, then regenerate
types: `cd studio && npm run typegen`. Always project explicit fields; never
return whole documents.

**`score()` will not take a dereference.** `tags[]->name match $q` is valid in a
filter and throws `score() function received unexpected expression` inside
`score()` — at runtime, as a 500, not at build. Only direct fields can be
scored. Matching on tags, authors or section still finds a document; it just
does not contribute to ranking.

**`array::unique()` compares references, not values.** Projecting `{name, slug}`
builds a fresh object per row, so unique() will not collapse duplicates. Dedupe
on a scalar (a slug) in TypeScript instead — see `navItems()` in SiteHeader.

**`suppressHydrationWarning` belongs on `<html>` and nowhere else.** The inline
theme script sets `data-theme` before React hydrates, which is a deliberate
mismatch. Adding it anywhere else hides real bugs.

**revalidateTag** takes two arguments in Next 16: `revalidateTag(tag, 'max')`.

**Ad slots** must render reserved height in every state, including empty. An ad
that loads into unreserved space wrecks CLS.

**The sponsor label** is generated from `sponsorTier`. Never hand-write a
disclosure label anywhere.

## Checks

```bash
cd web && npx tsc --noEmit && npm run build
```

## GROQ: never compare a possibly-missing field with `!=`

In GROQ a comparison where either side is null evaluates to **null**, and a
filter treats null as false. So this:

```groq
*[_type == "article" && retracted != true]   // WRONG
```

returns nothing for every document where `retracted` has never been set — which,
the moment you add the field, is all of them. It looks correct, type-checks,
builds green, and empties the site.

Use `coalesce` to give the missing field a real value before comparing:

```groq
*[_type == "article" && coalesce(retracted, false) == false]   // right
```

Same trap for any boolean or optional scalar added to an existing schema.

## Archive provenance: check the source before publishing

Three pieces from the archive's monthly "Missionary Story" column turned out to
be copied from Wikipedia and from a commercial site, running under a staff
byline. Two had already been published. See `studio/seed/articles/TRIAGE.md`.

Before importing any archive piece that reads like reference writing — a
biography, a historical summary, a doctrinal Q&A — search a distinctive full
sentence from it. Unsigned pieces and anything in a recurring column are the
high-risk cases; original interviews have never once been a problem.

`npm run retract` takes a published piece off the site without deleting it.
