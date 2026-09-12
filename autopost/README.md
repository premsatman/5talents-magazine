# 5Talents auto-posting to X + Facebook

Hands every "To post" row in the Notion schedule to Zernio as two scheduled
posts — X at 09:00 IST, Facebook at 19:00 IST, on the row's own date. Zernio
holds the queue and publishes. Nothing runs daily on your side.

Python 3.9+, no packages to install.

---

## Step 1 — Zernio account and API key

1. Sign up at **zernio.com**. Free tier is 2 connected accounts, no card.
2. In the dashboard, connect your **X account** (OAuth, one click).
3. Connect **Facebook**. This one has an extra step: after you approve, Zernio
   shows a list of the Pages you manage and you pick one. Make sure you're
   picking the 5Talents Page, not a personal profile — Meta's API won't post to
   a personal profile at all.
4. Copy your **API key** from the dashboard.

That's your 2 free accounts used exactly. Nothing else to connect.

### What this actually costs

Zernio's own fee is covered: new accounts get a **$12/month credit**, and 2
connected accounts is 2 × $6 = $12. So the Zernio line is $0.

**But the $12 credit does not cover X's API charge.** Zernio's docs are explicit
that the credit applies "against the connected-accounts line only", and that X
API pass-through "bills from the first unit, even with 2 or fewer accounts".

X's rates, passed through at cost:

| | rate |
|---|---|
| X post **without** a link | $0.015 |
| X post **with** a link | **$0.200** — 13× more |
| Facebook post | no per-post charge |

All 50 of your X posts contain a 5talentsmag.com link, so:

**50 × $0.200 = ~$10.00 for the full backlog**, then roughly **$6/month**
ongoing at one linked post a day.

The dry run in step 5 prints this total before you spend anything.

That 13× link premium is X's pricing, not Zernio's markup — you'd pay it going
direct too. Dropping links would cut it to $0.75, but for a magazine the link is
the entire point, so this is a real cost worth paying, not a mistake to fix.

## Step 2 — Get your two account IDs

```bash
export ZERNIO_API_KEY="your-key-here"
python3 schedule_posts.py --accounts
```

Prints a table like:

```
PLATFORM     STATUS         NAME                         ACCOUNT ID
twitter      connected      5Talents Magazine            acc_x_abc123
facebook     connected      5Talents Magazine Page       acc_fb_def456
```

You want the **ACCOUNT ID** column — not the handle, not the Page name.

## Step 3 — Notion token

1. Go to **https://www.notion.so/developers/tokens**
2. **New token** → name it ("5Talents posting") → tick the **Notion API**
   capability → **Create token**
3. Copy it. It starts `ntn_`.

That is the whole step. A personal access token runs with *your* permissions,
so it can already read every database you can — there is no "share the database
with the integration" step.

(That step does exist for the older-style internal integration, added via the
database's `···` → *Connections* menu. You do not need it here. If you ever use
an internal integration instead of a PAT, skipping it produces a 404 that looks
exactly like a bad token.)

On Business and Enterprise workspaces token creation is off by default — a
workspace owner enables it under **Settings → Connections**. If the **New
token** button is missing, that is why.

## Step 4 — Set your environment

```bash
export NOTION_TOKEN="ntn_..."
export ZERNIO_API_KEY="..."
export ZERNIO_X_ACCOUNT_ID="acc_x_abc123"
export ZERNIO_FB_ACCOUNT_ID="acc_fb_def456"
```

These live only in that terminal window. If you close it, re-export. To make
them stick, put the four lines in `~/.zshrc` — but then they're sitting in a
plain file, so your call.

## Step 5 — Dry run

```bash
python3 schedule_posts.py
```

Sends nothing. Prints every row it would schedule, the exact timestamps, and
anything it's skipping with the reason. Read this properly before moving on —
check the dates line up and the count looks right (should be 50).

## Step 6 — Test with two rows

```bash
python3 schedule_posts.py --commit --limit 2
```

Then **go and look in the Zernio dashboard**. You should see four queued posts —
two for X, two for Facebook — with the right copy and the right times. Check
that a link renders properly in the X preview.

If something's wrong, fix it before step 7. Undoing two scheduled posts is easy;
undoing a hundred is a bad afternoon.

## Step 7 — Schedule the rest

```bash
python3 schedule_posts.py --commit
```

Done. Zernio publishes from here on. Nothing needs to stay running — you can
close the terminal and shut the Mac.

---

## Day-to-day

**Adding new rows to Notion:** write them as usual with Status "To post", then
re-run `python3 schedule_posts.py --commit`. Only new rows get picked up.

**Re-posting a row already sent:** flip it back to "To post" in Notion, but
**cancel the old one in Zernio first** or it goes out twice.

**Changing copy for something already queued:** editing Notion does nothing —
it's already in Zernio's queue. Edit it in Zernio, or cancel there and re-run.

## Hashtags

Pulled live from your Notion **Hashtags** formula column and appended at the end
of the post, on their own line after a blank line:

```
...and the nine things that actually build influence.

https://5talentsmag.com/work-money/are-you-a-leader-influence

#WorkAndMoney #Leadership
```

- **X** gets at most **2**, matching your own column note ("For X use at most two")
- **Facebook** gets all of them
- If adding them would push an X post past 280, it drops one and retries, then
  posts without rather than breaking the limit. The dry run tells you how many
  rows that affected.
- Empty formula on a row → that row just posts without hashtags, no error

Change the caps at the top of the script:

```python
MAX_X_HASHTAGS  = 2     # your note: "For X use at most two"
MAX_FB_HASHTAGS = 0     # 0 = no limit
```

Turn them off entirely for one run with `--no-hashtags`.

Worth knowing: your own column note says *"For Facebook leave them off; they do
nothing there."* That is broadly right — hashtags don't help reach on Facebook
Pages. They're on for FB because you asked for it, which is fine if they're
there for branding rather than discovery. Set `MAX_FB_HASHTAGS` aside by using
`--no-hashtags`, or tell me and I'll make it X-only.

## What it skips, and why

Rows with no date, a date in the past, both post columns empty, or X copy over
280 characters. Length is counted **the way X counts it**, with every link
weighted at 23 characters regardless of real length. Several of your rows run
over 280 raw but pass once the link is weighted — all 50 currently pass.

After handoff a row is marked **"Posted"**, which is what stops re-runs
double-posting. Note "Posted" means *handed to Zernio*, not yet published.

If a slot has already passed — running this in the afternoon, when today's 09:00
is gone — that post goes out five minutes from now instead. Zernio rejects
timestamps in the past.

## Changing the times

Top of `schedule_posts.py`:

```python
X_HOUR  = "09:00:00"
FB_HOUR = "19:00:00"
```

---

## The n8n version

`n8n-workflow.json` is the same job as a scheduled n8n workflow — import via
*Workflows → Import from File*. It polls Notion each morning at 06:00 IST for
that day's row instead of scheduling everything up front.

You don't need it. It's here for the case where posts start being *generated*
fresh each day rather than written ahead in Notion — the only situation where a
daily poll earns the extra moving part.

It needs two n8n credentials: your Notion API credential, and a **Header Auth**
credential with header `Authorization` and value `Bearer <your zernio key>`.
Both account ids go in the *Config* node.

**Heads-up on your n8n instance:** `N8N_API_URL` is set to
`https://n8n.tunedup.one/mcp-server/http`. It should be the base URL,
`https://n8n.tunedup.one` — the tooling appends `/api/v1` itself. As configured,
health checks pass but every management call 404s. Worth fixing whether or not
you use this workflow.
