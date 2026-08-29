# Headline faces

Three options are already wired up and need no downloads — Fraunces,
Instrument Serif and Bricolage Grotesque, all served by `next/font/google`,
all SIL Open Font Licence, all free for commercial use. Switch between them
with `NEXT_PUBLIC_DISPLAY_FONT` in `web/.env.local`.

This folder is for the better option, which needs a two-minute download.

---

## On Casta

Worth knowing before you commit to it:

**The free version is Personal Use only.** The Dirtyline Studio product page
lists `Lisence: Personal Use` against the free download. This site will carry
advertising, which makes it commercial, so the free file would not cover you.
The commercial licence is the [Casta Serif Family at $29](https://dirtylinestudio.com/product/casta/)
— not a lot of money, but it has to be bought rather than downloaded.

**The free version is Thin only** — two styles, Casta-Thin and
Casta-ThinSlanted. A hairline high-contrast serif is the hardest thing to read
on a mid-range Android in daylight, which the blueprint identifies as your
actual reader's screen. It also fights the brush highlighter: yellow behind a
hairline stroke reads as a smudge, because there is not enough black to mark.

**It is a fashion face.** The foundry's own copy describes it as "elegant as
the best luxury fashion" and "a top model on the design catwalk". That is a
real look and a defensible one, but it is a different magazine from the one the
blueprint describes.

None of that rules it out. Buy the family, use a heavier weight than Thin, and
it would work. It is just three decisions rather than one.

---

## Fontshare — the recommendation

[Fontshare](https://www.fontshare.com) is the Indian Type Foundry's free font
service. Everything on it is released under the ITF Free Font License, which
permits commercial use outright — client work, products you sell, marketing,
websites — with no fee. The only restrictions are that you cannot resell or
redistribute the font files themselves.

An Indian foundry, free for commercial use, and genuinely good type. For a
magazine edited from India it is close to the obvious answer.

Two picks, both display serifs, both viewed against a real 5Talents headline:

| | Character | Why |
|---|---|---|
| **[Gambarino](https://www.fontshare.com/fonts/gambarino)** | Bold, warm, flared serifs, high contrast | The pick. It has enough mass to sit under the yellow highlighter and to survive a phone screen, and it looks like nobody else. |
| **[Boska](https://www.fontshare.com/fonts/boska)** | Elegant, very high contrast, lighter | The closest free relative of Casta. Beautiful, and it has the same thin-stroke caution attached. |

Also on Fontshare and worth a look: **Zodiak** (chunkier display serif),
**Melodrama** (fashion serif, close to Boska), **Clash Display** (if you decide
against a serif), and **Panchang**, which carries **Devanagari** — relevant to
the design system's note that Newsreader and Archivo have no Indic scripts.

### Installing one

1. Download the family from Fontshare and unzip it.
2. Copy the `.woff2` files into this folder, e.g.
   `Gambarino-Regular.woff2`.
3. In `web/src/app/layout.tsx`, uncomment the `localFont` block and add
   `gambarino` to `DISPLAY_FONTS`.
4. Set `NEXT_PUBLIC_DISPLAY_FONT="gambarino"` in `web/.env.local` and restart
   the dev server.

`next/font/local` self-hosts the file and preloads it, so there is no external
request and no font-swap shift — the same treatment the Google-hosted faces get,
which matters because Core Web Vitals affect both ranking and ad revenue.

---

## The wordmark does not change

`--font-wordmark` stays Anton regardless of what `--font-display` is set to.
Anton is the closest living relative of the masthead that ran across all
eighteen printed issues, and it is the one part of the identity worth holding
still while the rest moves. The design system's longer-term note stands: for a
permanent mark, redraw it as outlines so it does not depend on a Google Font at
all.
