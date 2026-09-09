/**
 * Retract an article that should not be public.
 *
 * Written on 30 August 2026, when the archive's "Missionary Story" column was
 * confirmed to be third-party text published under a staff byline. Two such
 * pieces were already live. This takes them down.
 *
 * It sets `retracted` and records why, rather than deleting. A deleted document
 * loses the record of what was published and for how long, which is exactly
 * what you want to keep if a rights-holder ever asks. Every front-end query
 * runs through the `live` filter in web/src/sanity/queries.ts, the article page
 * and the sitemap included, so a retracted document disappears from the site
 * completely on the next revalidation - not just from the listings.
 *
 *   npm run retract              # retract the two confirmed pieces
 *   npm run retract -- --list    # show what would happen, change nothing
 *   npm run retract -- <slug> "<reason>"
 *
 * To put one back after the rights question is settled, open it in the Studio
 * and untick Retracted. The retractionNote stays on the document as a
 * record either way.
 */
import { query, mutate } from './lib.mjs'

/** The confirmed cases, with the source each was taken from. */
const CONFIRMED = [
  {
    slug: 'martin-luther-the-reformer',
    reason:
      'Text is taken near-verbatim from "Martin Luther Biography" by Mary Fairchild, ' +
      'published on Learn Religions (formerly About.com Christianity), and was published ' +
      'under a 5Talents staff byline. That source is commercially published and all ' +
      'rights are reserved - unlike Wikipedia there is no licence that would let us ' +
      'republish it at all. Retracted 30 August 2026.',
  },
]

/**
 * Closed cases. Kept as a record, never acted on.
 *
 * A slug that has been dealt with must come out of CONFIRMED the moment it is
 * resolved. Leaving it there means the next bare `npm run retract` quietly takes
 * down the replacement - the list would be aimed at the very work that fixed the
 * problem.
 */
const RESOLVED = [
  {
    slug: 'graham-staines-thirty-four-years-in-orissa',
    note:
      'Retracted 30 August 2026: the text was near-verbatim from the English Wikipedia ' +
      'article, published under a staff byline. Replaced on 31 August 2026 by an article ' +
      'written from published reporting and reference sources, and brought back to the same ' +
      'URL. No longer a live case.',
  },
  {
    slug: 'youversion-fifty-million-to-one-billion',
    note:
      'Retracted 31 August 2026: the 2012 page was not an article but a quotation from ' +
      'LifeChurch.tv plus YouVersion\'s own usage infographic, unsigned. Replaced on ' +
      '1 September 2026 by an original 2026 feature written from published sources, ' +
      'bylined to 5Talents and filed outside the archive. No longer a live case.',
  },
]

async function retract(slug, reason) {
  const doc = await query(
    '*[_type == "article" && slug.current == $s][0]{_id, title, retracted, "rewritten": archiveMeta.rewrittenAt}',
    { s: slug },
  )

  if (!doc) return { slug, outcome: 'not found - nothing to do' }
  if (doc.retracted === true) return { slug, outcome: 'already retracted' }

  // A piece carrying archiveMeta.rewrittenAt has already been replaced with new
  // work. Retracting it would take down the fix rather than the fault, which is
  // exactly the mistake a stale list invites. Requires --force to override.
  if (doc.rewritten && !process.argv.includes('--force')) {
    return {
      slug,
      outcome: `REFUSED - this was rewritten on ${doc.rewritten}. Retracting would remove the replacement. Use --force if that is really what you want.`,
    }
  }

  await mutate([
    {
      patch: {
        id: doc._id,
        set: {
          retracted: true,
          retractedAt: new Date().toISOString(),
          retractionNote: reason,
        },
      },
    },
  ])

  return { slug, outcome: 'retracted - now off the site', title: doc.title }
}

const args = process.argv.slice(2)
const listOnly = args.includes('--list')
const custom = args.filter((a) => !a.startsWith('--'))

const targets =
  custom.length >= 1
    ? [{ slug: custom[0], reason: custom[1] ?? 'Retracted manually; no reason recorded.' }]
    : CONFIRMED

if (listOnly) {
  for (const t of targets) {
    const doc = await query(
      `*[_type == "article" && slug.current == $s][0]{
        title, retracted, retractionNote, "rewritten": archiveMeta.rewrittenAt
      }`,
      { s: t.slug },
    )
    if (!doc) {
      console.log(`${t.slug}\n  not in the dataset\n`)
      continue
    }
    console.log(t.slug)
    console.log(`  ${doc.retracted ? 'RETRACTED - off the site' : 'LIVE on the site'}`)
    // Print the note the document actually carries, not the reason in this file.
    // Those two drift apart, and the file's copy is the one that goes stale.
    if (doc.retracted && doc.retractionNote) console.log(`  on the document: ${doc.retractionNote}`)
    if (!doc.retracted) console.log(`  would be retracted for: ${t.reason}`)
    if (doc.rewritten) console.log(`  NOTE: rewritten ${doc.rewritten} - retracting would remove the replacement`)
    console.log()
  }
  for (const r of RESOLVED) console.log(`${r.slug}\n  CLOSED - ${r.note}\n`)
  console.log('--list: nothing was changed.')
} else {
  for (const t of targets) {
    const r = await retract(t.slug, t.reason)
    console.log(`${r.slug} - ${r.outcome}`)
  }
  console.log(
    '\nDone. Retracted articles are gone from the site on the next revalidation;\n' +
      'the documents stay in Sanity with the reason recorded on them.',
  )
}
