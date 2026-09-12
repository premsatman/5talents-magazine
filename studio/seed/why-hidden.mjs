/**
 * Why is this article not showing?
 *
 *   npm run why:hidden -- sure-footed-and-climbing
 *   npm run why:hidden -- https://www.5talentsmag.com/faith/sure-footed-and-climbing
 *
 * An article disappears from the site when any one of five conditions fails,
 * and, like the ad slots, it fails silently: the route 404s or the card simply
 * is not in the list. Nothing says why.
 *
 * Every listing and the article page itself share one filter, defined once in
 * web/src/sanity/queries.ts as `live`:
 *
 *   _type == "article"
 *   && defined(slug.current)
 *   && publishedAt <= now()
 *   && coalesce(retracted, false) == false
 *
 * plus, for the article route, `section->slug.current == $section`, which is
 * why an article can exist and answer at no URL at all if its section
 * reference is missing.
 *
 * This walks those conditions against the published dataset and reports the
 * first one that fails.
 *
 * THE ONE THAT CATCHES PEOPLE: `publishedAt <= now()`. publishedAt is a
 * datetime, not a date. Set it in the Studio while sitting in India and a
 * value that looks like today is stored as today at some hour UTC, which is
 * still in the future for the five and a half hours of the IST morning. The
 * article is then live tomorrow and invisible now — and any page already built
 * and cached on the live site keeps serving, so production shows it while a
 * dev server, querying fresh, does not.
 */
import { query, DATASET, PROJECT } from './lib.mjs'

const arg = process.argv[2]
if (!arg) {
  console.error('\nUsage: npm run why:hidden -- <slug or full article URL>\n')
  process.exit(1)
}

// Accept a pasted URL as readily as a slug; the last path segment is the slug.
const slug = arg.replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop()

const when = (iso) => {
  if (!iso) return '(not set)'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return `${iso}  << not a valid date`
  return `${iso}   (${d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)`
}

async function main() {
  console.log(`\nChecking ${PROJECT}/${DATASET} for slug "${slug}"\n`)

  // Drafts included deliberately: "I edited it and it vanished" is usually an
  // unpublished draft, and the published document is what the site reads.
  const docs = await query(
    `*[_type == "article" && slug.current == $s]{
       _id, title, publishedAt, retracted, retractionNote,
       "slug": slug.current,
       "sectionSlug": section->slug.current,
       "sectionExists": defined(section->_id),
       "hasSectionRef": defined(section._ref)
     }`,
    { s: slug },
  )

  if (!docs.length) {
    console.log('  No article with that slug exists, published or draft.')
    console.log('  Check the spelling, or whether the slug was renamed in the Studio.')
    console.log('  A renamed slug leaves the old URL dead and does not redirect.\n')
    return
  }

  const now = new Date()
  console.log(`  now  ${when(now.toISOString())}\n`)

  for (const doc of docs) {
    const draft = doc._id.startsWith('drafts.')
    console.log(`  ${doc.title ?? '(untitled)'}${draft ? '   *** DRAFT, NOT PUBLISHED ***' : ''}`)
    console.log(`    _id           ${doc._id}`)
    console.log(`    publishedAt   ${when(doc.publishedAt)}`)
    console.log(`    retracted     ${doc.retracted === true ? 'YES' : 'no'}`)
    console.log(`    section       ${doc.sectionSlug ?? '(none)'}`)

    const reasons = []
    if (draft) {
      reasons.push(
        'It is a draft. The site reads published documents only — press Publish in the Studio.',
      )
    }
    if (!doc.slug) reasons.push('No slug, so it has no URL.')
    if (!doc.publishedAt) {
      reasons.push('publishedAt is empty, and the filter requires publishedAt <= now().')
    } else {
      const at = new Date(doc.publishedAt)
      if (Number.isNaN(at.getTime())) {
        reasons.push(`publishedAt "${doc.publishedAt}" is not a valid date.`)
      } else if (at > now) {
        const hours = (at - now) / 3_600_000
        reasons.push(
          `publishedAt is ${hours < 24 ? `${hours.toFixed(1)} hours` : `${(hours / 24).toFixed(1)} days`} in the future, ` +
            'so it is scheduled, not hidden. It appears on its own.',
        )
        if (hours < 24) {
          reasons.push(
            'Under a day out, this is almost always the timezone: publishedAt is a ' +
              'datetime stored in UTC, and IST runs 5h30m ahead. Set the time to ' +
              '00:00 if you mean "that whole day".',
          )
        }
      }
    }
    if (doc.retracted === true) {
      reasons.push(
        `It is marked retracted${doc.retractionNote ? ` — "${doc.retractionNote}"` : ''}. That hides it everywhere by design.`,
      )
    }
    if (!doc.hasSectionRef) {
      reasons.push('No section reference, so it has no /section/slug URL to live at.')
    } else if (!doc.sectionExists) {
      reasons.push('Its section reference points at a document that no longer exists.')
    }

    if (reasons.length) {
      console.log('')
      for (const r of reasons) console.log(`    >> ${r}`)
    } else {
      console.log(`\n    >> Passes every filter. It should render at /${doc.sectionSlug}/${doc.slug}`)
      console.log('       Nothing in the data is hiding it, so whichever environment')
      console.log('       disagrees is serving a cache. See the note below.')
    }
    console.log('')
  }

  console.log('  When one environment disagrees with this report, that environment is')
  console.log('  serving a cache. Either one can be the stale side:')
  console.log('')
  console.log('    localhost behind   Next keeps a fetch cache on disk at web/.next/cache')
  console.log('                       and it survives restarts. Stop the dev server,')
  console.log('                       rm -rf web/.next, start it again.')
  console.log('    production behind  pages render statically with revalidate:false and')
  console.log('                       refresh only on a Sanity event. Republish the')
  console.log('                       document, or redeploy.')
  console.log('')
  console.log('  Production going stale is the one that matters: a piece you retract or')
  console.log('  reschedule can keep serving publicly after you believe it is gone.')
  console.log('  Always confirm a takedown on the live URL itself.\n')
}

main().catch((error) => {
  console.error(`\nCheck failed: ${error.message}\n`)
  process.exit(1)
})
