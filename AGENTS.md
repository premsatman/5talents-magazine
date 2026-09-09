

## Scripts must never overwrite an editor's choice

Three separate bugs in this project came from the same assumption: that a script
is the authority on a field a person can also edit. It is not.

- `import-articles.mjs` stamped `featured: 'none'` and hardcoded
  `sponsorTier: 'none'` on every run, which wiped the homepage heroes chosen by
  hand and would have stripped the paid-content label off a sponsored article.
- `import-articles.mjs` wrote `tableOfContents` with `set`, so a second file
  touching the same issue destroyed the contents list built by the first.
- `seed.mjs` wrote `siteSettings` with `createOrReplace`, which would have
  silently reverted `adsEnabled` and `enabledSlots` after ads were switched on
  and slots were sold.

**The rule: a script may create what is missing and may write what its source
file explicitly states. It may not reset a field to a default just because its
source file is silent.** In practice that means an existing value wins over a
default, the JSON can still override both by naming the value, and arrays that
people edit get merged on a stable key rather than replaced.

`npm run check` before every import. It catches truncated conversions, which is
the one failure that produces invented text under a real byline.
