# Weekly search-intent review — scheduled task prompt

Create this from the **Scheduled** section in the Claude sidebar.

- **Title:** 5Talents search intent review — weekly
- **Schedule:** Mondays, 09:30
- **Why weekly, not every 3 days:** Search Console data lags 2–3 days, so a
  3-day cycle would mostly re-read the same numbers. At 20–30 clicks a fortnight,
  day-to-day movement is noise. A week is the shortest honest signal — and it is
  also about how long Google takes to re-render a changed title.

Paste everything below the line as the task prompt.

---

Weekly search-intent review for 5Talents Magazine (5talentsmag.com). The goal is to find queries where the site is being SHOWN but not CLICKED, and fix the article to match what the searcher actually asked.

## Setup

Load the Composio tools first:
ToolSearch `select:mcp__444f2434-6bd2-4e02-a5fa-b734fdade5fe__COMPOSIO_SEARCH_TOOLS,mcp__444f2434-6bd2-4e02-a5fa-b734fdade5fe__COMPOSIO_MULTI_EXECUTE_TOOL`

Then load Sanity:
ToolSearch `select:mcp__2270a684-b48f-4204-904e-58d3f5dd1e6d__query_documents,mcp__2270a684-b48f-4204-904e-58d3f5dd1e6d__patch_documents,mcp__2270a684-b48f-4204-904e-58d3f5dd1e6d__publish_documents`

Accounts and IDs:
- Search Console: `GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY`, account `bunteezone@gmail.com`, site_url `sc-domain:5talentsmag.com`
- Google Analytics: `GOOGLE_ANALYTICS_RUN_REPORT`, account `bunteezone@gmail.com`, property `properties/552160231`
- Sanity: `{"projectId": "wdzgdrz5", "dataset": "production"}`

Search Console data lags 2–3 days, so query the window ending 3 days ago.

## Step 1 — Pull the data

From Search Console, for the last 14 days: queries, pages, and the date series. From GA4, for the last 7 days: sessionSourceMedium with sessions, engagedSessions and userEngagementDuration, plus top pagePaths.

Bing Webmaster Tools has no connector. If Prem has uploaded a Bing keyword CSV, use it — Bing exposes far more query text than Google, which anonymises most of it. If not, mention once that a fresh Bing export would improve the review, and carry on.

## Step 2 — Find the mismatches

Rank the opportunities:

1. **Position 1–10 with zero or near-zero clicks.** The page ranks but the title and description don't answer the query. Highest value, and usually the most common.
2. **Question clusters.** Several queries asking the same thing in different words — the article should carry that question as an H2.
3. **Pages with impressions but no matching content**, ranking for something they don't address.
4. **Rising queries** absent from the previous period.

Ignore anything under 2 impressions — noise at this traffic level.

## Step 3 — Fix what you find

- **Rewrite `seo.title`** so it contains the words people typed. Under 60 characters — article titles drop the brand suffix, so 60 is the real budget. Never change the editorial `title` field; that is the author's headline.
- **Rewrite `seo.description`** to answer the query and invite the click.
- **Add a "Quick answers" block** — an `h2` block, then `normal` blocks each opening with a bolded question (`marks: ["strong"]`) and its answer. Match the Mica Miller, Katie Taylor and Chosen church-screening articles.

Hard rules:
- Only state facts already in the article, or verified from a primary source this run. Never invent a date, figure, price or quote to fill an answer.
- Never alter the author's prose. You may add blocks; you may not rewrite existing ones.
- Link annotations need ABSOLUTE URLs (`https://www.5talentsmag.com/...`). The schema rejects relative paths and the publish will fail validation.
- Check whether an article already covers the topic before proposing a new one. Updating a page with ranking history beats publishing a near-duplicate that competes with it.

## Step 4 — Publish carefully

Patches save as drafts. Before publishing, list article drafts and check for any with no published version — those are Prem's unpublished work and must NOT be published. Publish only what you edited this run.

Publishing is enough — no deploy is needed. Two Sanity webhooks handle it: "Revalidate site" (`/api/revalidate`) refreshes the page, and "IndexNow on publish" (`/api/indexnow`) notifies Bing and Yandex. Changes are live within moments. If a fetched page looks stale, suspect the fetch tool's cache first and retry with a cache-busting query string before concluding anything about the site.

## Step 5 — Report

Keep it short:
- Clicks, impressions and CTR for the period, against the previous one
- What changed, and the query evidence for each change
- Anything needing Prem's judgment (a new article worth writing, an unverifiable fact, a campaign behaving oddly)
- One line on the trend — say flat or down plainly when it is

Do not inflate small numbers. At this traffic level a 3-click week and a 6-click week are the same week.
