# Rights in the archive — where things actually stand

Written 9 September 2026, from a query against the production dataset.

## The finding

**34 of the 63 live articles are by contributors whose `republishConsent` is
`pending` or `estate`.** `pending` is defined in your own schema as *"Asked, no
reply — hold their pieces."* They are not held. They are live.

Seventeen of the twenty-two contributors on file are `pending`. One —
Ingrid Albuquerque-Solomon, who died in May 2023 — is `estate`, and two of her
pieces are live, including "When Serpent Suicide Slithers in".

Only `Premasis Satman` and the house byline `5Talents` are `granted`.

## Why it happened

The gate you built checks the wrong field.

`import-articles.mjs` holds a piece back unless `archiveMeta.rightsCleared` is
`full` or `textOnly`. That check works — every live archive piece has one of
those two values. But `rightsCleared` is an article-level judgement about text
versus image rights. It is not the contributor's answer.

`republishConsent`, which *is* the contributor's answer, **is not read by
anything.** Not the import script, not the site, not the Studio structure. It
records a decision that nothing enforces. So a contributor can sit at "hold
their pieces" while their pieces publish.

That is a one-line fix in the import script and a Studio list; neither is done.

## What it means for the copyright notice

Under the Copyright Act 1957 the author owns their work unless it is assigned in
writing (s.19). The s.17(a) exception that gives a magazine's proprietor first
ownership applies to staff under a contract of service — not to the volunteer
and freelance contributors in this archive. No written assignments exist.

So the footer's old `© 2026 5Talents Magazine` claimed 34 pieces it does not
own. It now reads:

> © 2026 5Talents Magazine. Founded 2012. · Articles are © their authors.

It deliberately stops there. "…and appear here by permission" would be the
natural next clause and it is not yet true. Add it when it is.

The magazine does own the **collective work** — the selection, arrangement,
editing, headlines, and everything written in-house. That part of the notice is
sound.

## The harder question

Whether the original 2012–14 arrangement carries an implied licence to publish
on a public website in 2026 is a real question, and the honest answer is that
the argument is weaker here than it would be for an ordinary magazine. Those
issues were PDFs circulated privately to a closed list. A contributor who agreed
to that in 2013 did not obviously agree to open publication on the web thirteen
years later, in a different medium, to a general audience.

This is the part worth an hour of an actual media lawyer's time. It is also the
part where the cost of being wrong is not legal, in most cases, but relational:
these are pastors, missionaries and friends of the magazine, and the first they
would know of it is finding their own writing on a public website.

## Options, in the order they cost you

1. **Chase the consents.** Seventeen people, one email each. This is the outcome
   you want anyway, and most will say yes — the piece is theirs, it is being
   treated well, and being asked is flattering rather than alarming.
2. **Make the gate real.** Have the import script check `republishConsent` as
   well as `rightsCleared`, and add a Studio list for "live but not consented".
   Cheap, and it stops this recurring.
3. **Unpublish the 34 until they answer.** Safest, and it guts the archive on
   the eve of an ISSN application that needs a substantial archive.
4. **Leave them up knowingly, chase in parallel, take anything down the moment
   someone objects.** A defensible commercial judgement, but make it a decision
   rather than an accident — which is what it is today.

## Not an ISSN blocker

Worth separating: none of this blocks the ISSN. Their concern is work reproduced
from *other* publications, and these are your own back issues. The plagiarism
material in TRIAGE.md is the ISSN risk. This is a different problem that happens
to live in the same files.
