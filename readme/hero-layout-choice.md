# "Where the headline sits" — per-article hero choice (24 Sep 2026)

## What changed

**studio/schemaTypes/article.ts** — new field `heroLayout`, radio buttons, sits just above Body:
- `auto` (default) — whatever the section usually does
- `headlineFirst` — headline above the picture
- `overlay` — headline over the picture

**web/src/sanity/queries.ts** — `heroLayout,` added to the article projection.

**web/src/components/ArticleHero.tsx**
- `HeroArticle` gains `heroLayout?: string | null`
- `choice` / `sectionLeadsWithHeadline` / `headlineFirst` / `forcedOverlay` computed before the branches
- headline-first branch now keys off `headlineFirst`, not the section set
- overlay branch is `if ((overlay || forcedOverlay) && wide)`

`HEADLINE_FIRST_SECTIONS` (current, screen) is untouched and still the `auto` behaviour, so
every existing article renders exactly as before.

A forced overlay still refuses a portrait image — type over a tall picture has nowhere to go —
but it drops the 'wide enough' floor, since an editor choosing it has looked at the picture.

## Still to run (on the Mac — typegen does NOT work in the Cowork VM)

    cd studio && npx sanity schema deploy
    cd studio && npm run typegen
    cd web && npm run typecheck && npm run build
    git add -A && git commit -m "Per-article hero layout choice" && git push

`npm run typecheck` currently fails with "Property 'x' does not exist on type '{}'" across
page.tsx. That is expected and harmless: changing the query string invalidates the generated
result type until typegen regenerates it. It is not a code error, and typegen clears all of it.
