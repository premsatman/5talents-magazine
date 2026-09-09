"""Build a daily Facebook posting schedule for facebook.com/5TalentsMagazine.

Sequencing rules, in order of precedence:
  1. The relaunch letter opens. The page has been quiet since 2014; anyone
     arriving needs to know why it woke up before they are handed a 2013 essay.
  2. No two consecutive days share a section. Round-robin, largest section first
     - a naive alternation leaves the big sections bunched at the end.
  3. Sunday gets Faith or Wellbeing where the round-robin allows it.
  4. Talent Search interviews fall through the first weeks rather than being
     saved up. They are the strongest thing in the archive.

Regenerate with:  python3 studio/seed/build_schedule.py
"""

import csv
import datetime
import glob
import json
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
SEED = os.path.join(HERE, "articles")
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "social"))
SITE = "https://5talentsmag.com"
START = datetime.date(2026, 9, 7)  # Monday

SECTION_NAME = {
    "faith": "Faith",
    "culture": "Culture",
    "heritage": "Heritage",
    "work-money": "Work & money",
    "wellbeing": "Wellbeing",
    "technology": "Technology",
    "campus": "Campus",
}

# Published and not retracted, read from Sanity on 6 Sep 2026. Kept explicit so
# a piece still held in triage cannot leak into the schedule from a seed file.
LIVE = ['why-we-stopped-in-2014-and-why-we-are-back','for-two-years-of-my-teenage-life-i-did-not-look-in-a-mirror','chalta-hai-is-how-we-make-it-bearable','esther-only-woman-on-the-sound-crew','we-cut-the-tags-off-and-sold-the-clothes','mary-sujani-puppets-for-jesus','samuel-stanley-jones-prayer-gives-life-to-our-talents','pavithran-golconda-street-fighter-to-cameraman','bhaskar-rao-blind-musician','maria-clara-painting-for-jesus','ricky-biswasi-self-taught-worship-leader','if-my-child-were-caught-in-the-match-fixing','a-failed-candle-with-a-hole-in-it','an-mla-recited-psalm-103-in-telugu-and-i-cried-in-the-restroom','the-master-hands-out-the-talents-first','we-cannot-see-faith-but-we-see-because-of-it','people-of-the-plan','an-empty-lampstand-looking-good-and-running-on-empty','stewardship-of-our-talents-and-gifts','life-as-a-hanging-bridge','love-you-a-conversation-in-the-rain','we-say-freedom-and-mean-permission','the-same-night-they-fed-five-thousand','the-camp-that-god-built','workforce-in-the-royal-palace','i-prayed-for-a-week-that-the-coin-would-fall-my-way','our-welcome-mat-is-quite-worn-out','to-celebrate-or-not-to-celebrate','elizabeth-fry-angel-of-prisons','sadhu-sundar-singh-water-in-an-indian-cup','graham-staines-thirty-four-years-in-orissa','george-muller-never-asked-anyone-for-money','pandita-ramabai-sanskrit-scholar-who-built-mukti','the-american-who-wrote-the-hindi-grammar','william-carey-i-can-plod','youversion-fifty-million-to-one-billion','tools-of-a-perfect-prayer','elijah-asked-god-to-take-his-life','when-serpent-suicide-slithers-in','you-cannot-brake-by-trying-harder','zumba-my-way-of-life','are-you-a-leader-influence','are-you-living-up-to-your-potential','what-do-your-relationships-say-about-your-leadership','getting-rich-by-unjust-means','a-sewing-machine-does-more-than-a-cheque','are-you-a-prophet-or-a-puppet','the-year-we-fallowed-the-whole-farm','i-should-have-told-them','thirty-nine-years-a-pastor-and-i-changed-my-mind','facing-the-giants-in-your-life','investing-our-talents-for-his-kingdom','he-started-out-tending-sheep-on-the-hillside']

# A 2026 original that lives only in the Studio, not in a seed file.
EXTRA = {
    "why-we-stopped-in-2014-and-why-we-are-back": {
        "slug": "why-we-stopped-in-2014-and-why-we-are-back",
        "title": "Why we stopped in 2014, and why we are back",
        "deck": "Eighteen issues, a new baby, a format that stopped working, and a website taken from us. What happened to 5Talents in 2014 — and what returns in January.",
        "section": "faith",
        "kind": "feature",
        "tags": ["point-of-view"],
    }
}


def load():
    seed = dict(EXTRA)
    for path in sorted(glob.glob(os.path.join(SEED, "*.json"))):
        raw = json.load(open(path))
        items = raw if isinstance(raw, list) else raw.get("articles", [])
        for a in items:
            if isinstance(a, dict) and a.get("slug") and a["slug"] not in seed:
                seed[a["slug"]] = a
    missing = [s for s in LIVE if s not in seed]
    if missing:
        print("WARNING - no source for:", missing)
    return [seed[s] for s in LIVE if s in seed]


def why(a):
    """One line for the editor - adapt it, or drop it in the first comment."""
    tags = a.get("tags") or []
    meta = a.get("interviewMeta") or {}
    arch = a.get("archiveMeta") or {}
    sec = a.get("section")

    if "talent-search" in tags:
        who = meta.get("subject") or "the subject"
        return f"Talent Search. {who} in their own words - the franchise the magazine is named for."
    if "point-of-view" in tags:
        return "Point of view - an editorial. Worth saying in your own words why you are posting it."
    if sec == "heritage":
        return "Heritage. Stands alone for someone who has never heard of the magazine."
    if sec == "wellbeing":
        return "Wellbeing. Post it in the morning - this is the kind of piece people forward to one person."
    if sec == "work-money":
        return "Work & money. Ask something in the comments; this section invites replies."
    if arch.get("originalPage"):
        return "From the archive. Mention the original issue - twelve years of back numbers is the point."
    return "Straight share. The deck carries it."


def post_copy(a):
    url = f"{SITE}/{a['section']}/{a['slug']}"
    return "\n".join([
        a["title"].rstrip("."),
        "",
        (a.get("deck") or "").strip(),
        "",
        f"Read it: {url}",
    ])


def sequence(articles):
    pinned = articles[0]
    buckets = defaultdict(list)
    for a in articles[1:]:
        buckets[a["section"]].append(a)

    order = [pinned]
    last = pinned["section"]

    while any(buckets.values()):
        day = START + datetime.timedelta(days=len(order))
        options = sorted(
            (s for s, items in buckets.items() if items),
            key=lambda s: -len(buckets[s]),
        )
        pick = None
        if day.weekday() == 6:  # Sunday
            pick = next((s for s in options if s in ("faith", "wellbeing") and s != last), None)
        if pick is None:
            pick = next((s for s in options if s != last), options[0])
        order.append(buckets[pick].pop(0))
        last = pick

    return order


def main():
    os.makedirs(OUT, exist_ok=True)
    ordered = sequence(load())

    rows = []
    for i, a in enumerate(ordered):
        d = START + datetime.timedelta(days=i)
        rows.append({
            "Date": d.isoformat(),
            "Day": d.strftime("%a"),
            "Section": SECTION_NAME.get(a["section"], a["section"]),
            "Headline": a["title"],
            "Link": f"{SITE}/{a['section']}/{a['slug']}",
            "Post copy": post_copy(a),
            "Why this one": why(a),
            "Status": "To post",
        })

    cols = ["Date", "Day", "Section", "Headline", "Link", "Post copy", "Why this one", "Status"]
    with open(os.path.join(OUT, "facebook-schedule.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)

    md = [
        "# 5Talents on Facebook - daily posting schedule",
        "",
        f"One post a day to [facebook.com/5TalentsMagazine](https://www.facebook.com/5TalentsMagazine), "
        f"{rows[0]['Date']} to {rows[-1]['Date']}. {len(rows)} posts.",
        "",
        "No two consecutive days share a section, Sundays lean devotional, and the Talent Search "
        "interviews are spread through rather than saved up.",
        "",
        "**To load this into Notion:** import `facebook-schedule.csv` as a database rather than "
        "pasting this file - you get a Status property you can tick off and a calendar view. "
        "This version is for reading and for copying one post at a time.",
        "",
        "---",
        "",
        "## Index",
        "",
        "| Date | Day | Section | Headline |",
        "|---|---|---|---|",
    ]
    for r in rows:
        md.append(f"| {r['Date']} | {r['Day']} | {r['Section']} | {r['Headline']} |")

    md += ["", "---", "", "## The posts", ""]
    for r in rows:
        md += [
            f"### {r['Date']} · {r['Day']} · {r['Section']}",
            "",
            "```",
            r["Post copy"],
            "```",
            "",
            f"*{r['Why this one']}*",
            "",
        ]

    open(os.path.join(OUT, "facebook-schedule.md"), "w").write("\n".join(md))

    by_sec = defaultdict(int)
    for r in rows:
        by_sec[r["Section"]] += 1
    clumps = sum(1 for i in range(1, len(rows)) if rows[i]["Section"] == rows[i - 1]["Section"])

    print(f"{len(rows)} posts, {rows[0]['Date']} ({rows[0]['Day']}) to {rows[-1]['Date']}")
    print("by section:", dict(by_sec))
    print("consecutive same-section days:", clumps)
    print("Sundays:", [f"{r['Date']} {r['Section']}" for r in rows if r["Day"] == "Sun"])
    print("written to", OUT)


main()
