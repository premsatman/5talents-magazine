#!/usr/bin/env python3
"""
5Talents -> Zernio one-shot scheduler.

Reads the "5Talents - social posting schedule" Notion database, and hands every
row marked "To post" to Zernio as two scheduled posts:

    X         at 09:00 IST on the row's date   (uses the "X post" column)
    Facebook  at 19:00 IST on the row's date   (uses the "FB post" column)

Zernio holds the queue and does the actual publishing, so nothing needs to run
daily. Re-run this any time you add or edit rows in Notion - rows already
handed over are marked "Posted" and are skipped.

Usage:
    python3 schedule_posts.py              # dry run, shows what would happen
    python3 schedule_posts.py --commit     # actually schedule
    python3 schedule_posts.py --commit --limit 3   # toe in the water first

Environment variables required:
    NOTION_TOKEN            Notion internal integration secret (ntn_... / secret_...)
    ZERNIO_API_KEY          Zernio API key
    ZERNIO_X_ACCOUNT_ID     Zernio account id for the X account
    ZERNIO_FB_ACCOUNT_ID    Zernio account id for the Facebook Page
"""

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo

# ---------------------------------------------------------------- configuration

DATA_SOURCE_ID = "291377c0-779a-411f-bc77-c903620fb21a"
NOTION_VERSION = "2025-09-03"
NOTION_API = "https://api.notion.com/v1"
ZERNIO_API = "https://zernio.com/api/v1"

TIMEZONE = "Asia/Kolkata"
X_HOUR = "09:00:00"     # morning slot
FB_HOUR = "19:00:00"    # evening slot

X_LIMIT = 280           # X counts every URL as 23 characters
URL_WEIGHT = 23

# X API pass-through rates, billed by X and passed through by Zernio at cost.
# NOTE: these are NOT covered by Zernio's $12 monthly credit - that credit
# applies to the connected-accounts line only. X usage bills from the 1st unit.
X_COST_PLAIN = 0.015    # per post without a link
X_COST_URL   = 0.200    # per post containing an http/https link (13x more)

MAX_X_HASHTAGS = 2      # your Notion note: "For X use at most two"

# The Notion formula emits tags brand-first, section-last:
#   [#5Talents, #IndianChristians, #Faith]
# Taking the first two would put the SAME pair on every post. Taking the first
# and the last keeps the brand tag and picks up the tag that actually varies.
X_TAG_STRATEGY = "brand_and_section"   # or "first" for plain first-N
MAX_FB_HASHTAGS = 0     # 0 = no limit; all of them

STATUS_TODO = "To post"
STATUS_DONE = "Posted"

REQUEST_PAUSE = 0.4     # be polite to both APIs


# ---------------------------------------------------------------------- helpers

class Fatal(Exception):
    pass


def env(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise Fatal(
            f"Missing environment variable {name}.\n"
            f"See the header of this script for the full list."
        )
    return value


def http(url, method="GET", headers=None, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:600]
        raise Fatal(f"{method} {url}\n  HTTP {exc.code}: {detail}") from None
    except urllib.error.URLError as exc:
        raise Fatal(f"{method} {url}\n  Network error: {exc.reason}") from None


def slot_time(date_str, hhmmss):
    """
    Slot datetime for a row, as Zernio wants it (local wall time, no offset).

    If the slot has already passed - which happens for today's row when you run
    this in the afternoon - nudge it to five minutes from now so Zernio accepts
    it and publishes shortly, rather than rejecting a timestamp in the past.
    """
    tz = ZoneInfo(TIMEZONE)
    slot = dt.datetime.fromisoformat(f"{date_str}T{hhmmss}").replace(tzinfo=tz)
    now = dt.datetime.now(tz)
    if slot <= now:
        slot = now + dt.timedelta(minutes=5)
    return slot.strftime("%Y-%m-%dT%H:%M:%S")


def parse_hashtags(raw):
    """
    Normalise the Notion Hashtags formula into a clean list like ["#Faith"].

    Copes with whatever the formula emits - "#A #B", "#A, #B", "A B", extra
    whitespace - and never emits a bare "#" or a duplicate.
    """
    if not raw:
        return []
    tags, seen = [], set()
    for chunk in re.split(r"[\s,;/]+", str(raw).strip()):
        chunk = chunk.strip()
        if not chunk:
            continue
        tag = "#" + chunk.lstrip("#")
        if len(tag) < 2:
            continue
        key = tag.lower()
        if key not in seen:
            seen.add(key)
            tags.append(tag)
    return tags


def with_hashtags(text, tags, max_tags=0, max_len=None, strategy="first"):
    """
    Append hashtags on their own line at the end of a post.

    max_tags: cap the number used (0 = no cap).
    max_len:  if set, drop hashtags one at a time until the result fits.
              Returns the original text untouched if even one won't fit.
    """
    if not text or not tags:
        return text, []

    if not max_tags:
        chosen = list(tags)
    elif max_tags == 2 and strategy == "brand_and_section" and len(tags) >= 3:
        chosen = [tags[0], tags[-1]]      # brand + the section-specific one
    else:
        chosen = tags[:max_tags]

    while chosen:
        candidate = f"{text}\n\n{' '.join(chosen)}"
        if max_len is None or x_length(candidate) <= max_len:
            return candidate, chosen
        chosen = chosen[:-1]       # too long - drop the last one and retry
    return text, []


def x_cost(text):
    """X API pass-through cost for one post. Links make it 13x pricier."""
    return X_COST_URL if re.search(r"https?://", text) else X_COST_PLAIN


def x_length(text):
    """Character count the way X counts it: every URL weighs 23."""
    urls = re.findall(r"https?://\S+", text)
    total = len(text)
    for url in urls:
        total = total - len(url) + URL_WEIGHT
    return total


# ------------------------------------------------------------------------ notion

def formula_text(prop):
    """Read a Notion formula property's value as a string."""
    if not prop:
        return ""
    formula = prop.get("formula") or {}
    for key in ("string", "number", "boolean"):
        if formula.get(key) is not None:
            return str(formula[key])
    return ""


def plain(prop):
    """Flatten a Notion rich_text / title property to a plain string."""
    if not prop:
        return ""
    parts = prop.get("rich_text") or prop.get("title") or []
    return "".join(p.get("plain_text", "") for p in parts).strip()


def fetch_rows(token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
    }
    rows, cursor = [], None
    while True:
        body = {
            "filter": {"property": "Status", "select": {"equals": STATUS_TODO}},
            "sorts": [{"property": "Date", "direction": "ascending"}],
            "page_size": 100,
        }
        if cursor:
            body["start_cursor"] = cursor
        payload = http(
            f"{NOTION_API}/data_sources/{DATA_SOURCE_ID}/query",
            method="POST", headers=headers, body=body,
        )
        rows.extend(payload.get("results", []))
        if not payload.get("has_more"):
            break
        cursor = payload.get("next_cursor")

    parsed = []
    for row in rows:
        props = row.get("properties", {})
        date_prop = (props.get("Date") or {}).get("date") or {}
        parsed.append({
            "page_id":  row["id"],
            "date":     (date_prop.get("start") or "")[:10],
            "headline": plain(props.get("Headline")),
            "x_text":   plain(props.get("X post")),
            "fb_text":  plain(props.get("FB post")),
            "hashtags": parse_hashtags(formula_text(props.get("Hashtags"))),
        })
    return parsed


def mark_posted(token, page_id):
    http(
        f"{NOTION_API}/pages/{page_id}",
        method="PATCH",
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": NOTION_VERSION,
        },
        body={"properties": {"Status": {"select": {"name": STATUS_DONE}}}},
    )


# ------------------------------------------------------------------------ zernio

def pick(obj, *keys):
    """First present, non-empty value among several candidate key names."""
    for key in keys:
        value = obj.get(key)
        if value not in (None, "", []):
            return value
    return None


def list_accounts(api_key, raw=False):
    """Print connected accounts and their ids, for filling in the env vars."""
    payload = http(
        f"{ZERNIO_API}/accounts",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    accounts = payload.get("data") or payload.get("accounts") or payload
    if isinstance(accounts, dict):
        accounts = accounts.get("accounts", [])
    if not accounts:
        print("No connected accounts. Connect X and your Facebook Page in the "
              "Zernio dashboard first.")
        return 1

    if raw:
        print("Raw response:\n")
        print(json.dumps(payload, indent=2)[:6000])
        print()

    rows = []
    for acc in accounts:
        if not isinstance(acc, dict):
            continue
        rows.append({
            "platform": pick(acc, "platform", "provider", "network", "type") or "?",
            "status":   pick(acc, "status", "state", "connectionStatus",
                              "isConnected", "connected", "active") or "?",
            "name":     pick(acc, "displayName", "name", "username", "handle",
                              "profileName", "screenName") or "?",
            "id":       pick(acc, "id", "accountId", "account_id", "uuid", "_id",
                             "accountID", "socialAccountId", "platformAccountId",
                             "externalId"),
        })

    missing = [r for r in rows if not r["id"]]
    if missing and not raw:
        # Couldn't find the id under any expected key - show the real shape so
        # the right field name is obvious, rather than printing "?" again.
        print("Could not find an account id field. Keys actually returned:\n")
        for acc in accounts:
            if isinstance(acc, dict):
                print("  " + ", ".join(sorted(acc.keys())))
        print("\nFull response:\n")
        print(json.dumps(payload, indent=2)[:6000])
        return 1

    print(f"{'PLATFORM':<12} {'STATUS':<14} {'NAME':<28} ACCOUNT ID")
    print("-" * 92)
    for r in rows:
        print(f"{str(r['platform']):<12} {str(r['status']):<14} "
              f"{str(r['name'])[:26]:<28} {r['id']}")

    x_id = next((r["id"] for r in rows
                 if str(r["platform"]).lower() in ("twitter", "x")), None)
    fb_id = next((r["id"] for r in rows
                  if str(r["platform"]).lower() == "facebook"), None)
    print("\nCopy-paste these:\n")
    print(f'  export ZERNIO_X_ACCOUNT_ID="{x_id or "<not connected>"}"')
    print(f'  export ZERNIO_FB_ACCOUNT_ID="{fb_id or "<not connected>"}"')
    return 0


def schedule(api_key, platform, account_id, content, when):
    return http(
        f"{ZERNIO_API}/posts",
        method="POST",
        headers={"Authorization": f"Bearer {api_key}"},
        body={
            "content": content,
            "scheduledFor": when,
            "timezone": TIMEZONE,
            "platforms": [{"platform": platform, "accountId": account_id}],
        },
    )


# -------------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Schedule 5Talents posts via Zernio.")
    ap.add_argument("--commit", action="store_true",
                    help="actually schedule (default is a dry run)")
    ap.add_argument("--limit", type=int, default=0,
                    help="only process the first N rows")
    ap.add_argument("--no-hashtags", action="store_true",
                    help="do not append the Notion Hashtags column to posts")
    ap.add_argument("--accounts", action="store_true",
                    help="list your connected Zernio accounts and their ids, then exit")
    ap.add_argument("--raw", action="store_true",
                    help="with --accounts, also dump the raw API response")
    args = ap.parse_args()

    if args.accounts:
        return list_accounts(env("ZERNIO_API_KEY"), raw=args.raw)

    notion_token = env("NOTION_TOKEN")
    if args.commit:
        zernio_key = env("ZERNIO_API_KEY")
        x_account = env("ZERNIO_X_ACCOUNT_ID")
        fb_account = env("ZERNIO_FB_ACCOUNT_ID")
    else:
        zernio_key = x_account = fb_account = "(dry-run)"

    today = dt.date.today().isoformat()
    rows = fetch_rows(notion_token)
    print(f"Notion returned {len(rows)} row(s) marked '{STATUS_TODO}'.\n")

    queue, skipped = [], []
    for row in rows:
        if not row["date"]:
            skipped.append((row, "no date set"))
        elif row["date"] < today:
            skipped.append((row, f"date {row['date']} is in the past"))
        elif not row["x_text"] and not row["fb_text"]:
            skipped.append((row, "both post columns are empty"))
        elif x_length(row["x_text"]) > X_LIMIT:
            skipped.append((row, f"X post is {x_length(row['x_text'])} chars (limit {X_LIMIT})"))
        else:
            queue.append(row)

    # Append the Notion Hashtags column. X is capped (and trimmed further if the
    # post would break 280); Facebook takes all of them.
    for row in queue:
        tags = [] if args.no_hashtags else row.get("hashtags", [])
        row["x_final"], row["x_tags"] = with_hashtags(
            row["x_text"], tags, MAX_X_HASHTAGS, X_LIMIT, X_TAG_STRATEGY)
        row["fb_final"], row["fb_tags"] = with_hashtags(
            row["fb_text"], tags, MAX_FB_HASHTAGS, None)
        row["tags_available"] = tags

    if args.limit:
        queue = queue[:args.limit]

    for row, reason in skipped:
        print(f"  SKIP  {row['date'] or '????-??-??'}  {row['headline'][:52]:<52}  {reason}")
    if skipped:
        print()

    if not queue:
        print("Nothing to schedule.")
        return 0

    total = sum(x_cost(r["x_final"]) for r in queue if r["x_final"])
    linked = sum(1 for r in queue if r["x_final"] and re.search(r"https?://", r["x_final"]))
    no_tags = [r for r in queue if not r["tags_available"]]
    trimmed = [r for r in queue
               if r["tags_available"] and len(r["x_tags"]) < min(MAX_X_HASHTAGS, len(r["tags_available"]))]

    verb = "Scheduling" if args.commit else "Would schedule"
    print(f"{verb} {len(queue)} row(s), two posts each "
          f"(X {X_HOUR[:5]} IST / Facebook {FB_HOUR[:5]} IST):\n")
    print(f"  Estimated X API cost: ${total:.2f}"
          f"  ({linked} of {len(queue)} posts contain a link, at ${X_COST_URL:.3f} each)")
    print(f"  Facebook posts have no per-post charge.")
    print(f"  This is X's own charge passed through at cost. Zernio's $12 monthly")
    print(f"  credit does NOT cover it - that applies to connected accounts only.\n")
    if not args.no_hashtags:
        print(f"  Hashtags: from the Notion Hashtags column. Up to {MAX_X_HASHTAGS} on X, "
              f"all of them on Facebook.")
        if no_tags:
            print(f"  {len(no_tags)} row(s) have an empty Hashtags formula - posted without.")
        if trimmed:
            print(f"  {len(trimmed)} row(s) had a hashtag dropped to stay under 280 on X.")
        print()

    ok = failed = 0
    for row in queue:
        x_when = slot_time(row["date"], X_HOUR)
        fb_when = slot_time(row["date"], FB_HOUR)
        label = f"{row['date']}  {row['headline'][:58]}"

        if not args.commit:
            x_note = "  <- slot passed, goes out shortly" if not x_when.startswith(f"{row['date']}T{X_HOUR[:2]}") else ""
            fb_note = "  <- slot passed, goes out shortly" if not fb_when.startswith(f"{row['date']}T{FB_HOUR[:2]}") else ""
            print(f"  {label}")
            xt = " ".join(row["x_tags"]) or "-"
            ft = " ".join(row["fb_tags"]) or "-"
            print(f"      X   {x_length(row['x_final']):>3}c  {x_when}  "
                  f"${x_cost(row['x_final']):.3f}  tags: {xt}{x_note}")
            print(f"      FB  {len(row['fb_final']):>3}c  {fb_when}  "
                  f"tags: {ft}{fb_note}")
            ok += 1
            continue

        try:
            if row["x_final"]:
                schedule(zernio_key, "twitter", x_account, row["x_final"], x_when)
                time.sleep(REQUEST_PAUSE)
            if row["fb_final"]:
                schedule(zernio_key, "facebook", fb_account, row["fb_final"], fb_when)
                time.sleep(REQUEST_PAUSE)
            mark_posted(notion_token, row["page_id"])
            print(f"  OK    {label}")
            ok += 1
        except Fatal as exc:
            print(f"  FAIL  {label}\n        {exc}")
            failed += 1
        time.sleep(REQUEST_PAUSE)

    print(f"\n{ok} succeeded, {failed} failed.")
    if not args.commit:
        print("Dry run only - nothing was sent. Re-run with --commit to schedule.")
    return 1 if failed else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Fatal as exc:
        print(f"\nError: {exc}", file=sys.stderr)
        sys.exit(2)
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        sys.exit(130)
