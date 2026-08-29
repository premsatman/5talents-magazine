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
    slug: 'graham-staines-thirty-four-years-in-orissa',
    reason:
      'Text is taken near-verbatim from the English Wikipedia article "Graham Staines" ' +
      'and was published under a 5Talents staff byline. Wikipedia is CC BY-SA, so ' +
      'republication is possible, but only with attribution and share-alike licensing - ' +
      'not under our own byline. Retracted 30 August 2026 pending a decision on whether ' +
      'to attribute it properly or rewrite it from primary sources.',
  },
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

async function retract(slug, reason) {
  const doc = await query(
    '*[_type == "article" && slug.current == $s][0]{_id, title, retracted}',
    { s: slug },
  )

  if (!doc) return { slug, outcome: 'not found - nothing to do' }
  if (doc.retracted === true) return { slug, outcome: 'already retracted' }

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
      '*[_type == "article" && slug.current == $s][0]{title, retracted}',
      { s: t.slug },
    )
    const state = !doc ? 'not in the dataset' : doc.retracted ? 'already retracted' : 'live'
    console.log(`${t.slug}\n  currently: ${state}\n  ${t.reason}\n`)
  }
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
