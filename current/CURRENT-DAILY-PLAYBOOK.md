# Current: the daily playbook

One post a day on /current → Instagram the same evening → Dailyhunt the next day. About 60 to 75 minutes end to end once it's routine.

Companion to `daily-posts-traffic-plan.md` (the verification rule) and `readme/CURRENT-SECTION-SPEC.md` (the schema). Each day's files go in `current/YYYY-MM-DD-<slug>/`.

---

## The beat: what counts as a Current story

In scope: faith showing up in public, anywhere in the world.

| Lane | Examples | Where to look first |
|---|---|---|
| Screen | The Chosen, Angel Studios releases, Netflix/Prime faith titles, Christian films at the box office | thechosen.tv press, press.amazonmgmstudios.com, Angel Studios newsroom, Movieguide, Deadline/Variety "faith" |
| Said | A celebrity, artist or athlete talking about Jesus in an interview, speech or podcast | The original interview video, then Christian Post, CBN, Relevant, Premier Christian News |
| Prayed | Public prayer after a final, a prayer circle on the pitch, a blessing at a big event | Match footage and the club's own post, then CNA, EWTN, Deseret News, Sports Spectrum |
| Research | Barna, Lifeway, Pew, Gallup, YouVersion, State of the Bible | The report itself |
| Events | Big conferences, gatherings and tours (Passion, Lausanne, Hillsong/Elevation tours) | The organiser's newsroom |

**Out of scope, no exceptions:** political controversy, Indian politics, communal incidents, persecution stories, court cases, elections, US culture-war fights dressed as faith news.

## The daily routine

**1. Pick (10 min, morning).** Scan the sources above. Choose the story that (a) happened in the last 72 hours or has a date coming up, (b) has a named primary source, and (c) a 20-year-old would send to a friend. Log two backups in the Notion schedule.

**2. Verify (10 min).** This is the WITNESS test from the traffic plan. Has a newsroom with a masthead covered it? Can we name the people and the place? Is the clip current, not recycled? If it fails any of these, skip it.

**3. Write (20 min).** 400 to 600 words. The structure that worked today:
- Hook: one line saying what's surprising
- What happened, with dates, numbers and names
- The Bible angle: one or two verses, quoted in full (KJV), and only where they actually connect
- Why it matters to a 20-year-old: one "real talk" paragraph, grace-first, no lecture
- How to watch / join / read more
- Sources line at the bottom

Then do the edit pass: genzdevo voice rules (a GenZ phrase at most twice), humanizer rules (no em dashes, no "testament", no rule-of-three padding, straight quotes), and a read-aloud check.

**4. Image (5 to 10 min).** Follow the rights table in `images-and-rights.md`. The default is our own typographic card: yellow/ink/cream, CURRENT label, big headline. Use studio press images only for editorial coverage of that title. Church kits and anything from Getty, AP or Reuters need permission first.

**5. Publish to Sanity.** Section `current`, kind `brief`, `briefMeta.sourceUrl` filled in, `rightsBasis` set, no `onlineIssue`. **`publishedAt` controls when the post appears.** The site hides anything dated in the future, so set it to now to go live straight away. A future date works as a built-in scheduler: the post appears at that time on its own.

**6. Instagram (15 min, the same evening).** Header on every slide: `5TALENTS` in Bebas Neue, a thin straight line, then `CURRENT` in Montserrat Bold, letter-spaced, in capitals (same pattern as the section cards: `FAITH`, `WORK & MONEY`). A 5-slide carousel:
1. Hook headline
2. What happened
3. The verse
4. Dates/numbers
5. Why it hits, plus a CTA

Caption: hook → story in three short paragraphs → question to drive comments → 10 to 12 hashtags. Link in bio and in a pinned first comment. Evening slot is 19:00 to 21:00 IST. Alternate with 07:30 IST some days for US readers.

**7. Dailyhunt (10 min, the next day).** A shorter rewrite (250 to 350 words) with an India angle ("how to watch from India", an Indian church connection where one exists), our own image, and a link back to the full article. Post after 24 hours so our page is indexed first.

## Dailyhunt setup (one time)

1. Apply as a creator at **dhcreator.dailyhunt.in**, or email **creators@dailyhunt.in** with the 5Talents Instagram link, the site URL and 3 sample posts. Today's piece works as one sample.
2. Once approved, post from the DH Creator portal or the Dailyhunt app (the "create post" option).
3. **Keep it cultural, not news.** Dailyhunt is an Indian news aggregator, and the traffic plan deliberately keeps us clear of Indian news and current affairs under the IT Rules 2021. Screen, research and "faith in public" posts are fine there. Don't post anything that touches Indian politics or communal issues, even when it's in scope for the website.
4. **Later:** a Hindi version on Dailyhunt could reach more readers than English. Test it after the first month, once English numbers exist.
5. **Track it:** add `?utm_source=dailyhunt&utm_medium=referral&utm_campaign=current` to the link back, so GA4 shows what Dailyhunt actually sends us.

## Weekly rhythm (so it doesn't all become The Chosen)

| Day | Lane |
|---|---|
| Mon | Screen |
| Tue | Said / Prayed (WITNESS) |
| Wed | Research (FINDINGS) |
| Thu | THEN & NOW (archive vs now) |
| Fri | Said / Prayed (WITNESS) |
| Sat | Events, or REMEMBER WHEN |
| Sun | Screen, or the week's biggest story |

## Tag decision needed

Today's post doesn't fit any of the four franchise tags (witness, findings, then-and-now, remember-when). Suggestion: add a fifth tag, **`screen`**, for films and series. Faith TV and film is a steady weekly supply of stories, and `/tags/screen` becomes a landing page of its own.
