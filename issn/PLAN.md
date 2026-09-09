# e-ISSN application — 5Talents Magazine

Plan of record. Written 9 September 2026 against the two ISSN India documents
(*Guidelines for requesting an ISSN* and *Detailed information document for ISSN
assignment*, both CSIR-NIScPR) and against the live site and this repo.

Decisions taken so far: **publisher = Premasis Satman personally**, **frequency =
monthly**, **numbered monthly issues begin January 2027**, **editorial board yet
to be recruited**.

> **Correction, 9 September 2026.** The 2012–14 run was never printed. Eighteen
> issues were made as PDFs and circulated privately to a small closed list; they
> were not sold, not publicly distributed and not available to a general reader.
> The magazine was therefore not publicly published until 2026. The
> pre-application query had already gone out describing a print run, and
> `QUERY-EMAIL-CORRECTION.md` corrects it. Every claim of print or of
> "published since 2012" has been removed from the site. This *strengthens* the
> application: it removes any argument about the starting year.

---

## 0. The three things that actually decide this

Everything below is detail. These are the three that fail an application.

1. **Five editorial board members with institutional email addresses.** The ISSN
   office emails three of them at random and gives them **three days** to reply.
   No reply, application declined summarily. This is the long pole — allow 6–8
   weeks — and it is the only item that depends on other people.
2. **Nothing plagiarised or reproduced may be live when they look.** The
   guidelines reserve the right to decline "if plagiarized article(s) is/are
   detected or if an article(s) has been reproduced from another publication".
   The TRIAGE work already done in this repo is exactly the right defence, but
   it has to be finished and nothing held may slip back online.
3. **The publisher's name and full Indian postal address must be displayed on
   the site** and must match the application form character for character. It is
   not on the site today.

---

## 1. Decided: the "Year" field says 2026

**Decided 9 September 2026: the Year field says 2026.**

The form asks for the **starting year of the format being applied for** — here,
online. The online format genuinely started in 2026 when the website went live,
and that is the defensible answer. Numbered monthly issues still begin in January
2027: frequency and start year are separate claims on the form.

Why not January 2027, which was the first instinct: the site is live now with
articles dated September 2026. An assessor opening it sees 2026 publication.
(The footer used to read "Published since 2012" and the about page called the
2012–14 run a print run; both were wrong on the facts and have been corrected —
see the note at the top. The correction makes 2026 not merely defensible but the
only honest answer, since nothing before it was publicly published at all.) The guidelines let the centre decline "if it is
considered that misleading information has been provided by the requestor or
printed/displayed on the publication", and a 2027 start year against a visibly
2026 site is precisely that.

What this decision commits us to:

- The ~40 live articles get organised into **monthly online issues for the months
  they were actually published**, 5+ articles each — the minimum the guidelines
  set for a non-annual publication.
- Volume 1 covers 2026. January 2027 opens **Volume 2, Issue 1** and the monthly
  cadence proper.
- **Submission target: mid-November 2026. ISSN expected around January 2027**
  (30 working days minimum), so Volume 2 Issue 1 can carry it from day one.

---

## 2. Site gap audit

Checked against the live site and `web/src` + `studio/schemaTypes`. Each item
below is mandatory in one of the two documents.

| # | Requirement | Source | Status |
|---|---|---|---|
| 1 | Editorial Board page/tab on the magazine's own site, min. 5 members | Detailed doc §3 | Page built · **needs five members** |
| 2 | Publisher name + complete Indian postal address displayed | Guidelines, general; Detailed doc §2 | Built · **needs your address in Site settings** |
| 3 | Journal Particulars block on the main/about page | Detailed doc §6 | Built · **needs subject + contact filled in** |
| 4 | Bibliographic details on the first page of every article — magazine name, volume, issue, month, year | Detailed doc §7 | Built · **needs every article assigned to an issue** |
| 5 | Archive of online issues, articles listed by title, each separately linked | Detailed doc §4 | Built at `/issues` · **needs the 2026 issues created** |
| 6 | Plagiarism policy published (UGC guidelines) | Detailed doc §12 | **Done** — `/plagiarism` |
| 7 | Aims and scope, frequency, language, starting year, format, subject on the main page | Detailed doc §6 | Built into the particulars block · **needs filling in** |
| 8 | Author guidelines / submission details | Detailed doc §6 | Present (`/write-for-us`) |
| 9 | Title identical everywhere — site, articles, form | Detailed doc §1 | Present, keep it that way |
| 10 | Permanent, non-temporary website | Detailed doc §11 | Present |
| 11 | Contact email on the magazine's own domain | Detailed doc §10 | **Still missing** — no address on the domain yet |
| 12 | Open access, so no user ID/password to supply | Guidelines, online | Present |

### Built on 9 September 2026

The site work is done. What is left on all of it is content you have to supply,
not code.

**New in the Studio**

- *Site settings → Publisher & ISSN* — a **Publisher of record** block (name,
  street, city, state, PIN, country, email, mobile) and a **Journal particulars**
  block (starting year, frequency, subject, languages, format, e-ISSN, print
  ISSN). Starting year is pre-set to 2026 and frequency to Monthly.
- *Site settings → Publisher & ISSN* — an **Editorial board** list, separate from
  the masthead, warning below five members.
- *Contributors* — four new fields used only by board members: designation,
  institutional postal address, institutional email and institutional profile
  link. The email field rejects Gmail, Yahoo, Outlook and the like with the
  reason, because ISSN India will.
- *Online issues* — a new document type carrying volume, issue number and month.
  Articles now have an **Online issue** field, and there is an
  **Articles → Not in an issue yet** list for finding what still needs one.

**New on the site**

- `/editorial-board` — every member with designation, institution, full postal
  address, institutional email and profile link. Shows a holding line until the
  board exists.
- `/issues` and `/issues/[slug]` — the online issue archive, grouped by volume,
  each issue listing its articles by title with a link each. Deliberately no
  whole-issue PDF: §4 asks that consolidated issue downloads be avoided.
- `/plagiarism` — the published policy.
- Journal particulars table and a publisher block on `/about`, with the
  publisher's imprint line, e-ISSN and links to both in the footer of **every**
  page.
- A citation line on every article: *5Talents Magazine · Volume n, Issue n ·
  Month Year*. Page numbers are deliberately omitted rather than invented — a
  fabricated page range on a web article is the kind of detail that gets an
  application declined.

**What you have to do before any of it shows up**

1. In the Studio, fill in *Site settings → Publisher & ISSN*: your name, full
   postal address, PIN, an email on the 5talentsmag.com domain, mobile, and the
   subject. Nothing renders until these exist — the components return nothing
   rather than showing half an address.
2. Create the 2026 online issues and assign every live article to one. Five
   articles per issue is the floor.
3. Recruit the board (§3), then add each member as a Contributor with the four
   institutional fields and list them in the Editorial board.

**Two commands, on your Mac** — I could not run either from here, because the
`node_modules` in this repo are macOS builds and this session's shell is Linux:

```bash
cd studio && npm run typegen     # regenerates web/src/sanity/types.generated.ts
cd ../web && npm run build
```

The typegen is not optional. The generated query types are keyed by the exact
text of each GROQ query, and several queries changed, so `tsc` will report
errors on the pages using them until it is re-run. Everything else typechecks
clean — I ran the TypeScript compiler against the tree to confirm the only
remaining errors are that one stale-types class.

### What each gap means in this codebase

**1 — Editorial board page.** `siteSettings.masthead` already models role +
person, and `author` has designation-ish fields, but no institutional address and
no institutional email. Needs: two new fields on `author` (institutional postal
address, institutional email), a `profileUrl`, and a `/editorial-board` route
rendering them. The detailed document is specific: full name, designation,
complete affiliated institutional address, institutional email — and Patron,
Editor-in-Chief, Editor and Managing Editor named as such.

**2 — Publisher block.** Because you are publishing in your own name rather than
through a body, the site must say so: *"Published by Premasis Satman, [street],
Hyderabad, Telangana [PIN], India."* Note this replaces the current "Published by
5Talents Magazine" framing on the about page — the form and the site have to
agree, and the form will carry your name. Put it in the footer and on the contact
page, both driven from `siteSettings`.

**3 — Journal Particulars.** The detailed document gives the exact table (§6):
Title, Frequency, ISSN, Publisher name, Publisher address, Starting year,
Subject, Language, Publication format, Email, Mobile. Build it as a component fed
from `siteSettings` so the ISSN can be dropped in once allotted.

**4 — Bibliographic details.** `article` has `publishedAt` and `archiveMeta`, but
no volume/issue/page. Online issues need volume and issue numbers from the start.
Add `volume`, `issue`, `pages` (or a derived issue reference) and render a
citation line at the head of every article.

**5 — Online issue archive.** The existing `archiveIssue` type is close but its
`pdfFile`/`pdfUrl` model belongs to the private-circulation era. The detailed
document explicitly says to
avoid linking a consolidated issue PDF and to list articles by title with a link
each. The 2012–14 PDFs are fine as a historical archive; the *online* issues need
a table of contents linking to article pages.

**6 — Plagiarism policy.** A short page stating UGC guidelines are followed, plus
your correction and retraction practice. `retracted` / `retractionNote` already
exist in the schema, which is more than most applicants can show.

---

## 3. Editorial board — recruitment

Five members minimum. For each one the ISSN office wants:

- full name
- designation
- **complete institutional postal address**
- **institutional email on the organisation's own domain** — Gmail, Yahoo and the
  like are explicitly to be avoided
- a **public profile page on that organisation's own website** (emailed
  separately to the ISSN office; only profile links hosted by the affiliated
  institution are accepted)

The institutional email plus institutional profile link is the binding
constraint. It rules out most freelancers and independent ministry workers, and
it points at people employed by an institution with a real website.

### Where to look

- Bible colleges and seminaries in India — faculty pages usually carry both an
  institutional address and a staff profile
- Christian universities and their departments of theology, communication or
  English
- Christian publishing houses and magazine editors with an org domain
- Registered ministry organisations and NGOs with a proper website and staff page
- One or two people outside India **only if** you want to present the magazine as
  international in scope; the guidelines require an international board in that
  case, so it is a commitment, not a garnish

Roles to fill, named explicitly on the page: Patron (optional but useful),
Editor-in-Chief, Editor, Managing Editor, plus members to reach five.

### The ask

Be straight that this is a culture and formation magazine, not a scholarly
journal — the "senior faculty only" rule in the guidelines is written for
scholarly journals, and you should not dress 5Talents up as one. What you are
asking for is light: a name on the masthead, editorial direction two to four
times a year, and one email answered promptly during the ISSN process.

### The verification briefing — do not skip this

Once the application is in, the status changes to *"Verification mails sent"*.
Three of your five are emailed at random. **Each has three days to reply, and a
member who does not reply gets the whole application declined summarily.** You
are not allowed to ask which three were picked.

So, before submitting, email all five:

- the exact sender address to watch for: `issnindia.niscpr@csir.res.in`
- ask them to whitelist it and to check spam and trash daily for two weeks
- tell them a reply is needed within three days and that any brief confirmation
  is enough
- warn that institutional spam filters are the usual culprit

If two or more never *receive* the mail, you can write and ask for a resend — but
that costs weeks, so prevention is cheaper.

**Allow 6–8 weeks** from first approach to five confirmed members with addresses
and profile links in hand.

---

## 4. The application form, field by field

The form runs on a **20-minute timer**, so have every value written out and paste
them. Nothing here should be composed live.

| Form field | Value |
|---|---|
| Tell us about your publication | **New title** |
| Title | **5Talents Magazine** — exactly as on the site, nothing appended |
| Date (YYYY) | **2026** — see §1 |
| Frequency | **Monthly** |
| If Other specify | leave blank |
| Format | **Online** |
| RNI Number | leave blank — not applicable to an online publication |
| URL | `https://5talentsmag.com/` |
| Is Username and Password required | **unchecked** — open access |
| Subject | choose the closest option in the live dropdown; the site's own scope wording ("culture and formation … faith, work, wellbeing, campus, church history") should guide it. Prefer a specific option over Multi-Disciplinary if one fits |
| Language/s | **English** |
| Owner Name / Applicant Person Name | **Premasis Satman** — must match the address proof you post |
| Name of Issuing/Publishing body/Publisher | **leave blank** — that field is for people applying on behalf of a publisher, and you are the publisher |
| Mobile | your number |
| E-mail / Confirm E-mail | a **5talentsmag.com address**, not Gmail. Every later correction must be sent from this same address |
| Publisher Address | your full street address |
| Town/City | Hyderabad |
| State | Telangana |
| Pin Code | your PIN |
| Additional information | a two-line note: 5Talents Magazine was founded in Hyderabad in July 2012 and eighteen issues were produced as PDFs circulated privately to a closed list until July 2014; it was first publicly published as a website in 2026, and those eighteen issues are held at `/archive` as the magazine's origins rather than as prior publication. Volunteering this is better than letting them find the 2012 dates and wonder — and it matches the correction already sent by email |
| Terms and conditions | tick |

### After submitting

1. Go to **Application Status** and download the filled form.
2. Sign the printout.
3. Post it with **self-attested copies of address proof** (Aadhaar, Voter ID,
   driving licence or passport — the same person named as Owner) to:
   *The Head, National Science Library, ISSN National Centre India, c/o
   CSIR-NIScPR, 14 Satsang Vihar Marg, New Delhi 110067.*
4. Separately email the **five editorial board members' institutional profile
   links** to `issnindia.niscpr@csir.res.in` from the magazine address.
5. Expect **30 working days minimum**.

### After the ISSN arrives

It is **provisional**. It is not registered on the international portal, and no
registration certificate is issued, until you publish the **next** issue and
email a request letter from the registered address confirming it. So the ISSN is
only really yours one month after it lands — build that into the plan rather than
treating the allotment email as the finish line.

Then: display it in the Journal Particulars block and on article pages, and never
use it for a print edition — using an ISSN assigned to one format for another is
explicitly not allowed. A print ISSN is a separate application. If you ever want
one, check the PRGI/RNI position first: under the PRP Act 2023 registration bites
on publications carrying "public news or comments on public news", which the
no-news scope statement is designed to keep you outside of, but the exemption the
guidelines spell out by name is for journals of a scientific, technical or
academic nature — which 5Talents is not. Worth the same one media-lawyer
conversation the blueprint already calls for.

---

## 5. Sequence

Decided 9 September 2026.

**Weeks 1–2 (mid–late September 2026)**
- Send the pre-application query in `issn/QUERY-EMAIL.md`, asking whether the
  five-member institutional board requirement applies to a general-interest
  magazine. Ask it, then carry on recruiting as if the answer is yes.
- Confirm the exact publisher name and postal address to be used everywhere.
- Register and start using an editor address on the 5talentsmag.com domain.
- Draw up the list of editorial board targets — aim for 10–12 approaches to land 5.
- Search `nsl.niscpr.res.in` and `issn.org` for title duplication before anything else is built.

**Weeks 2–6 (late September – late October)**
- Send the board approaches. This runs in the background of everything below.
- ~~Build the site gaps~~ — done 9 Sep. Fill in Site settings, create the 2026
  issues, assign every article to one.
- Finish the TRIAGE work. Nothing held or unresolved may be live.

**Weeks 6–9 (late October – mid November)**
- Board confirmed: five members, addresses, institutional emails, profile links.
- Editorial board page live and accurate.
- Organise the 2026 articles into numbered online issues, 5+ articles each.
- Send the verification briefing to all five.

**Week 9–10 (mid November)**
- Submit the form. Post the signed copy and address proof. Email the profile links.

**Weeks 10–16 (mid November – late December)**
- Watch for "Verification mails sent" and chase your board generally, without
  asking who was contacted.
- Keep publishing. Any change to journal particulars or board membership must be
  reported to the ISSN office while the application is open.

**January 2027**
- ISSN expected. Volume 2 Issue 1 — the first of the monthly cadence —
  publishes carrying it.

**February 2027**
- Publish the next issue and email the request letter that converts the
  provisional ISSN into a confirmed one.

---

## 6. Risks worth naming

- **The board is the whole timeline.** Five people with institutional emails is
  harder than it sounds, and the three-day reply window means you need people who
  actually read their institutional inbox.
- **The 2012–14 archive cuts both ways.** It is real evidence of a working
  history, and it is also where the plagiarism exposure lives. Everything TRIAGE
  flagged must stay offline.
- **Any change after submission must be reported.** Board member leaves, address
  changes, frequency shifts — write to the ISSN office from the magazine address
  or risk rejection.
- **The archive is where inaccurate claims hide.** Correcting the about page was
  the easy half. Thirty-nine article provenance notes said "Published as printed
  in the … issue", the social card image said "PUBLISHED SINCE 2012", and an
  article headline still says "In 2012 we printed a page of YouVersion's
  numbers". A site that contradicts its own correction is worse than one that
  never corrected. Anything written from here on should say *made*, *ran* or
  *carried* about 2012–14 — never *printed* or *published*.

- **A rejection costs a full restart.** While an application is pending you can
  correct it — a formal email from the magazine's primary address. But once it is
  declined there is no appeal: you file a fresh application with every document
  again, and wait out the 30 working days a second time. That is the argument for
  closing every gap in §2 before submitting rather than hoping.
