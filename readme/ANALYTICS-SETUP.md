# Analytics and Search Console — setup

The code is already in. `src/components/Analytics.tsx` loads GA4, and it stays
dormant until two conditions are both true: `NEXT_PUBLIC_GA_ID` is set, and
`VERCEL_ENV` is exactly `production`. Nothing below is required for the site to
run.

**Everything here is blocked on buying the domain.** Search Console verifies
ownership of a domain, and GA4's data stream wants the real hostname. Doing it
against a `*.vercel.app` URL means redoing it, and losing the history when you
migrate.

---

## 1. Buy the domain

The blueprint's trademark warning applies first: "Five Talents" is an
established name in Christian nonprofit work, and `5talents.org` /
`fivetalents.co` are held. Search the Indian trademark register and USPTO for
classes 16, 35 and 41 before committing. An hour now, or an expensive problem
later.

Once bought, three things in this repo want updating:

```bash
# web/.env.local and Vercel's env settings
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"

# Sanity CORS
cd studio && npx sanity cors add https://yourdomain.com --credentials
```

And set the contact address in Sanity → Site settings, which is still blank for
this reason.

---

## 2. Create the GA4 property — ✅ done 31 Aug 2026

Measurement ID **`G-9EKQJ11F2V`**, already set in `web/.env.local`. The four
defaults below are **not** done yet and are the part that matters.

<details>
<summary>Creation steps, for reference</summary>

1. [analytics.google.com](https://analytics.google.com) → **Admin** (gear, bottom left)
2. **Create** → **Property**
3. Name it `5Talents Magazine`. Set timezone **India** and currency **INR** —
   both affect how days are bucketed and neither is easy to change later
4. Business details: publishing, smallest size band
5. Objectives: pick **Examine user behaviour**. Ignore the ecommerce options
6. **Web** as the platform → Website URL is your domain → stream name
   `5Talents Magazine — web`
7. Copy the **Measurement ID**. It looks like `G-A1B2C3D4E5`

</details>

### Change four defaults before you collect anything — ⚠️ still to do

GA4's defaults are wrong for a publication. All four are in **Admin**:

| Setting | Default | Set it to | Why |
|---|---|---|---|
| **Data retention** → Data collection and modification | **2 months** | **14 months** | The single most important one. Two months means you cannot compare this year to last, and it is *not retroactive* — data already discarded is gone |
| **Enhanced measurement** (on the web stream) | On | Leave on, confirm **"Page changes based on browser history events"** is ticked | This is what tracks App Router client-side navigations. Without it you get one pageview per session |
| **Internal traffic** → Data filters | Unfiltered | Add your own IP, set the filter to **Active** | Otherwise your own reading and testing is a meaningful share of a small site's traffic |
| **Google signals** | Off | Your call | On gives demographics and cross-device, useful for an advertiser deck. It also adds thresholding, which suppresses more small-count rows. Off is the more accurate choice while traffic is low |

### Register custom dimensions — do this before the first ad event

**Admin → Custom definitions → Create custom dimension.** Event-scoped, four of
them, with the parameter name matching exactly what `lib/analytics.ts` sends:

| Dimension name | Scope | Event parameter |
|---|---|---|
| Ad slot | Event | `ad_slot` |
| Advertiser | Event | `advertiser` |
| Campaign | Event | `campaign` |
| Creative | Event | `creative` |

GA4 does **not** backfill these. An event that arrives before its dimension is
registered keeps the parameter value nowhere you can reach it. Register them the
day you sell the first ad, not the day you want the first report.

---

## 3. Put the ID into Vercel

Vercel dashboard → project → **Settings → Environment Variables**:

- Key `NEXT_PUBLIC_GA_ID`, value `G-9EKQJ11F2V`
- Environment: **Production only**. Not Preview, not Development

Leaving Preview unticked is belt-and-braces — `Analytics.tsx` already refuses to
load outside `VERCEL_ENV=production` — but it means a mistake in the component
can't leak preview traffic into the property either.

Redeploy. Environment variables are baked in at build time, so an existing
deployment will not pick this up.

---

## 4. Confirm it works

1. Open the production site in a normal browser window
2. GA4 → **Reports → Realtime**. You should appear within about 30 seconds
3. If nothing arrives, in order: is the deploy newer than the env var; is
   `VERCEL_ENV` production (not a preview URL); is a content blocker running in
   your browser; does the page source contain `googletagmanager.com`

Also confirm the negative: load a preview deployment and check that **no**
request to `googletagmanager.com` fires. That is the gate doing its job.

---

## 5. Search Console — DNS verification

A **Domain property** covers `www` and non-`www`, `http` and `https`, and every
subdomain, in one place. A URL-prefix property covers exactly one of those,
which is why people end up with four properties and no complete picture.

1. [search.google.com/search-console](https://search.google.com/search-console) →
   **Add property** → the left-hand **Domain** box
2. Enter the bare domain — `yourdomain.com`, no `https://`, no `www`
3. Google shows a TXT record: `google-site-verification=<long string>`
4. At your registrar's DNS panel, add a record:
   - **Type** TXT
   - **Name / Host** `@` (some registrars want the domain itself, or blank)
   - **Value** the full `google-site-verification=...` string
   - **TTL** whatever the default is
5. Wait. Ten minutes is usually enough; some registrars take hours
6. Back in Search Console, **Verify**

If it fails, the cause is almost always the Name field. Some panels append the
domain automatically, so entering `yourdomain.com` produces
`yourdomain.com.yourdomain.com`. Use `@` or leave it blank.

**Leave the TXT record in place permanently.** Removing it un-verifies the
property and you lose access to the data.

---

## 6. Submit the sitemap

`src/app/sitemap.ts` and `robots.ts` are already correct — the sitemap covers
every static page, every section, and every published article, and robots.txt
points at it.

Search Console → **Sitemaps** → enter `sitemap.xml` → Submit.

Then **Settings → Users and permissions**, and check the property is associated
with the same Google account as GA4. In GA4, **Admin → Search Console links**
lets you join them, which puts search query data inside GA4 reports. Worth doing
once both exist.

Expect "Discovered — currently not indexed" on a lot of URLs for the first few
weeks. On a new domain with no authority that is normal, not a fault.

---

## 7. What this does not cover

**Consent.** No banner, by decision — defensible while EU traffic is a small
share and the site is pre-revenue. The moment AdSense goes live, Google requires
a certified CMP for EEA and UK traffic, and Consent Mode v2 becomes a real
piece of work. Do not let it surprise you in the same week as the ad launch.

**Ad measurement.** `lib/analytics.ts` has `adImpression()` and `adClick()`
ready, and nothing calls them yet. When they do fire, GA4 is the analysis layer
and not the billing record — it is blocked for a large minority of readers,
thresholds small rows, and cannot measure viewability. See
`TunedUp-Ads-Platform-Spec.md` §5 for why that distinction matters before you
invoice anyone.

**Bing.** Bing Webmaster Tools can import a verified Search Console property in
about two clicks. Small traffic, near-zero effort, and worth doing on the same
afternoon.
