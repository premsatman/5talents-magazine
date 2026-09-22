# Screen: the film and TV section, and the road to Netflix Media Center

Written 22 Sep 2026. Companion to `readme/CURRENT-SECTION-SPEC.md` and `current/CURRENT-DAILY-PLAYBOOK.md`.

**Goal:** by the time the first numbered issue is out (January 2027), 5Talents should look like a real international entertainment outlet with a faith lens. That means a dedicated section, steady Netflix coverage, and the credentials a publicist checks. Then apply for a Netflix Media Center press account.

**Audience:** international by default. 5Talents is written for a global Christian readership, and GA4 already shows the US and India roughly level, followed by the Philippines, the UK, Canada and Sweden. India gets priority because we're based here and know it best. It's an extra layer on top of global coverage, not the frame.

---

## 1. The decision: Screen becomes its own section, not part of Current

| | Current | Screen (new) |
|---|---|---|
| What | Faith in public: prayers on the pitch, research, THEN & NOW, REMEMBER WHEN | Films, series, streaming, Hollywood and Indian cinema, faith-on-screen |
| URL | `/current/...` | `/screen/...` |
| Kinds | `brief` | `brief` (news), `review`, `feature` (explainers, lists) |
| Search intent | Low, mostly social | High: "true story", "where to watch", "is it OK for kids", "release date", "cast" |
| Lifespan | Days | Evergreen: explainers and lists get updated and rank for months |

**Why separate:** entertainment searches are a different game. They reward topic authority, meaning many pages about the same titles and people linked to each other. They need structured data (Review, Movie, TVSeries). And they need their own landing page Google can see as "this site covers film and TV". If this sits inside Current, it gets diluted by prayer-circle posts and research briefs. A Netflix publicist checking the site also needs to see an entertainment section with your name on it.

**Move now:** the two pieces already written (The Chosen S6E1, Death of the Pastor's Wife) move from Current to Screen. Current goes back to its four franchises.

## 2. What Screen publishes

Five formats. Each one matches a type of search people actually make.

1. **News brief** (300 to 500 words, same day): release dates, trailers, renewals, casting, and a creator or star talking about faith. For example: "The Chosen Season 6 is premiering in church first".
2. **True-story explainer** (600 to 900 words): "What happened to Mica Miller?", "Is *House of David* biblically accurate?". These get the most search traffic. Always include the *What to know* box and *Quick answers*.
3. **Faith-lens review** (600 to 900 words, `kind: review`, uses the existing `reviewMeta` with a rating): what it gets right, what it gets wrong, and who it's for.
4. **Parents' content guide** (400 to 600 words): "Is *X* OK for teens? Language, violence and faith content". This is where Plugged In and Movieguide get their traffic. Ours is written for families in any country and adds regional ratings (US, UK, India) that they don't give.
5. **Where-to-watch list** (evergreen, updated monthly): "Best Christian films on Netflix right now", "New faith series streaming this month". Each entry notes where it's available: US, UK, India, and anywhere else we can confirm. One page per list, kept at the same URL and updated each month. An India-only edition ("...on Netflix India") can follow once the main list ranks.

**Everyday Netflix and entertainment updates** are the bread and butter of the section. Most days' posts will be format 1: what's new on Netflix, season renewals, casting news, trailers, what a star said. The one rule: **report it, don't rumour it.** Every update needs a named source, such as Netflix Tudum, Deadline, Variety, THR or the person's own post. Leave out "insiders say", dating rumours and anything about someone's private life that they haven't made public themselves. That keeps the section safe to link to, and publicists don't grant press access to gossip sites.

**Where to watch, by country: the edge.** Most outlets write for a US reader and stop there. Every Screen piece should say where the title is available in at least the US, the UK and India, plus any other market we can confirm (the Philippines, Canada, Australia, Nigeria and Kenya are common for faith audiences). Include the platform, the language options and the release date in each. India always gets its line, because we're based here and big US outlets leave it out. It is one line among several, though, not the headline.

**Cadence:** 1 Screen post each weekday within the existing 5-a-day rhythm. That's about 60 to 70 Screen pieces by January, and at least 25 of them should be about Netflix titles. (Why: see §5.)

## 3. How Screen is different on the site

Build list, in the order it matters:

- [ ] **Section:** add `'screen'` to `SECTION_SLUGS` in `web/src/lib/sections.ts`, and create the Section document in Studio (name "Screen", description "Films, series and streaming, with a faith lens and a where-to-watch guide for every country we can confirm.").
- [ ] **New `screenMeta` object on `article`**, shown only when the section is Screen:
  - `workTitle`, `workType` (film / series / documentary)
  - `availability[]`: one row per region, with `region` (US / UK / India / Philippines / Global...), `platform`, `languages` and `releaseDate`. Aim for at least US, UK and India.
  - `releaseDate` (worldwide or original premiere)
  - `contentAdvisory` (language / violence / sexual content / themes, each none, mild, moderate or strong)
  - `trailerUrl` (YouTube embed)
- [ ] **A "Watch it" card** rendered from `screenMeta` at the top of each piece: a small table of where to watch it by country, the release date and the advisory. This is the block Google and AI answers will quote.
- [ ] **Section page layout:** poster-style grid, with rails for *Now streaming*, *Coming soon* and *Reviews*. It's different from the photo-hero layout of Faith and Culture.
- [ ] **Title hubs:** one tag per franchise (`the-chosen`, `house-of-david`, ...). `/tags/the-chosen` becomes the page that collects every piece on the title. Link to it from each article.
- [ ] **Structured data:**
  - `NewsArticle` on briefs
  - `Review` with `itemReviewed: Movie | TVSeries` and `reviewRating` on reviews (from `reviewMeta.rating`)
  - `ItemList` on where-to-watch lists
  - `BreadcrumbList` everywhere
  - Skip FAQPage schema: Google no longer shows it for magazines.
- [ ] **Google News and Discover:** register 5talentsmag.com in Google Publisher Center. Discover needs large images (1200 px or wider) with `max-image-preview:large`, which is one more reason press-image access matters.
- [ ] **Ad settings for Screen pages:** Netflix's media terms forbid showing their assets on pages that promote gambling, or alcohol, tobacco or firearms sold to under-21s. Block those ad categories site-wide. If that isn't possible, at least block them on `/screen`.

## 4. Images: the rule until press access comes through

Until we have Netflix Media Center access, Screen images follow the same rights table as Current:

- our typographic card by default
- embedded official trailers (YouTube embed, no download)
- studio press images only where the studio releases them for editorial use (Amazon MGM press site, Angel Studios newsroom)

After approval, the Netflix media terms apply:

- **No modification.** Assets must be used "as provided". That means no text overlays or crops on Netflix stills, unlike what we did with the Come and See kit. Put our text next to the image, not on top of it.
- **Keep them from dominating the page.** Assets can't be "the most distinctive or prominent feature" of a page without permission, so the 5Talents masthead and headline must always lead.
- **No brand misuse.** Never use Netflix names or logos in our own branding, and never imply Netflix endorses us.

Record every Netflix asset with `rightsBasis: permission` and `rightsNote: "Netflix Media Center, <date>"`.

## 5. Netflix Media Center: what we can and can't know

**What access gives:** local publicity contacts for each title, title details and cast lists, downloadable photos and press kits, and screener requests. Screeners are given out at publicists' discretion.

**What Netflix doesn't publish:** the approval criteria. The form asks for a "professional Press account", and a person decides. So the plan is to look like an outlet a publicist would say yes to:

| What a publicist checks | Where we'll be by Jan 2027 |
|---|---|
| A real entertainment section | `/screen` live since October, 60+ pieces |
| Regular Netflix coverage | 25+ pieces on Netflix titles, including reviews, not just rewrites of news |
| Named editor, work email on our domain | Premasis Satman, Editor, prem@5talentsmag.com. The author page should list Screen pieces. |
| Masthead and standards | About, editorial board, corrections and plagiarism pages (already built). Add an entertainment editorial policy: no spoilers before release, embargoes respected. |
| Legitimacy | e-ISSN (application in progress), numbered January 2027 issue, 2012 founding |
| Audience | GA4 monthly users and Screen page views; Instagram followers; newsletter subscribers. Screenshot these for the application. |
| Reach and niche | "An international Christian culture magazine covering faith and family on screen, with readers in the US, India, the Philippines and the UK". India is a strong secondary pitch for Netflix India's publicity team. |

**Apply in two places:**
1. **Netflix Media Center** (media.netflix.com/en/apply), January 2027, once the first issue is out. Apply as an international outlet.
2. **Netflix India publicity** as well, by a direct email introducing 5Talents, with links to our five best Netflix pieces. Being based in India makes this the easiest regional team to build a relationship with, and regional teams are the ones who hand out screeners.

**Start now with the easier ones:** Amazon MGM Studios press site (we already use it), Angel Studios press, Lionsgate and Wonder Project, Disney press, and in India JioHotstar and Sony Pictures India. Each approval is a credential we can list in the Netflix application.

## 6. Timeline

| When | What |
|---|---|
| **Late Sept** | Create Screen section and `screenMeta`, move the 2 existing pieces, create franchise tags |
| **October** | Watch-it card, section layout, Review/Movie schema. Register in Google Publisher Center. Apply to Amazon MGM and Angel press. |
| **Oct–Dec** | 1 Screen post per weekday (about 60 by January). First monthly "Faith films on Netflix right now" list on 1 Nov, updated 1 Dec and 1 Jan. |
| **November** | *The Chosen* S6 on Prime (15 Nov): a review of each episode drop is a natural run of 4 pieces. |
| **December** | Pull GA4 and social numbers. Write the entertainment editorial policy page. |
| **January 2027** | Issue 1 out, with a Screen feature inside it. Apply to Netflix Media Center and email Netflix India publicity. |
| **Feb–Mar 2027** | Follow up once, politely, after 3 to 4 weeks if we hear nothing. Keep publishing either way. |

## 7. Guardrails that don't change

- **Scope:** no political controversy, and US culture-war fights are out.
- **True-crime and abuse stories:** use safe-messaging language (no method details, helplines at the end). Attribute every allegation in pending cases, and include the accused's response.
- **Spoilers:** never in headlines or the first paragraph. Mark a spoiler section clearly.
- **Copying:** no copying from other outlets. Every piece needs a primary source and an angle of our own (faith lens or the where-to-watch-by-country guide), or it doesn't get written.
