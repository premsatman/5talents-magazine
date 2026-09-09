/**
 * Why is my ad not showing?
 *
 *   npm run ads:why
 *
 * An ad slot renders nothing when any one of six conditions fails, and it fails
 * silently by design: a slot that cannot fill reserves its space and says
 * nothing, because an error message in an ad slot is worse than an empty one.
 * That is correct behaviour for readers and useless behaviour for whoever is
 * trying to work out what they got wrong.
 *
 * This walks the same logic AdSlot.tsx uses, in the same order, and reports the
 * first condition that fails for each slot.
 *
 * The two that catch people:
 *
 *   - The document is still a draft. Sanity's Studio saves as you type, so a
 *     document can look complete and finished on screen and not exist as far as
 *     the site is concerned. Published and draft are separate documents.
 *   - `adsEnabled` is still "off", which is the initial value and the correct
 *     one until the day you actually want ads visible.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..')
const PROJECT = 'wdzgdrz5'
const DATASET = 'production'
const API = '2026-08-27'
const base = `https://${PROJECT}.api.sanity.io/v${API}`

// Must match AD_SIZES in web/src/lib/media.ts.
const SIZE = {
  A: [970, 250],
  B: [336, 280],
  C: [336, 280],
  D: [300, 600],
  E: [336, 280],
  F: [970, 90],
  I: [160, 600],
  J: [160, 600],
}
const SLOTS = Object.keys(SIZE)

/**
 * Sanity puts the dimensions in the asset _ref: image-<hash>-970x90-png.
 *
 * A creative of the wrong shape is the one failure that produces no error
 * anywhere. AdSlot lets a booked image keep its aspect ratio and scale to fit,
 * so a 970x90 booked on slot D renders about 300x28 in the article rail and
 * reads as a horizontal rule rather than an advertisement.
 */
const dims = (ref) => {
  const m = /-(\d+)x(\d+)-[a-z]+$/.exec(ref ?? '')
  return m ? [Number(m[1]), Number(m[2])] : null
}

async function token() {
  if (process.env.SANITY_API_WRITE_TOKEN) return process.env.SANITY_API_WRITE_TOKEN
  const env = await readFile(join(REPO, 'web', '.env.local'), 'utf8')
  const m = env.match(/^SANITY_API_(?:WRITE|READ)_TOKEN\s*=\s*"?([^"\n]+)"?/m)
  if (!m) throw new Error('No Sanity token in web/.env.local')
  return m[1]
}

async function query(groq, auth) {
  const url = new URL(`${base}/data/query/${DATASET}`)
  url.searchParams.set('query', groq)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${auth}` } })
  if (!res.ok) throw new Error(`Query failed ${res.status}: ${await res.text()}`)
  return (await res.json()).result
}

const tick = (ok) => (ok ? 'yes' : 'NO')

async function main() {
  const auth = await token()
  const today = new Date().toISOString().slice(0, 10)
  console.log(`\nChecking ${PROJECT}/${DATASET} for ${today}\n`)

  /* 1. Settings ------------------------------------------------------ */
  const settings = await query('*[_id == "siteSettings"][0]{ adsEnabled, enabledSlots }', auth)
  if (!settings) {
    console.log('  siteSettings does not exist. Run npm run seed.\n')
    return
  }

  const adsEnabled = settings.adsEnabled ?? 'off'
  const enabled = settings.enabledSlots ?? []
  console.log(`  adsEnabled     ${adsEnabled}`)
  console.log(`  enabledSlots   ${enabled.length ? enabled.join(', ') : '(none)'}`)

  if (adsEnabled === 'off') {
    console.log('\n  >> adsEnabled is "off", so NOTHING will render in any slot.')
    console.log('     Set it in the Studio: Site settings > Ads > Advertising live.')
    console.log('     For your own promotions choose "House ads only".')
    console.log('     If that option is missing, run npm run schema:deploy first.\n')
  }

  /* 2. Every advertiser document, drafts included -------------------- */
  const ads = await query(
    `*[_type == "advertiser"]{
       _id, name, tier, slots, activeFrom, activeTo,
       "hasCreative": defined(creative.asset),
       "creativeRef": creative.asset._ref
     }`,
    auth,
  )

  console.log(`\n  ${ads.length} advertiser document${ads.length === 1 ? '' : 's'}:\n`)
  if (!ads.length) console.log('    (none)\n')

  for (const a of ads) {
    const draft = a._id.startsWith('drafts.')
    const dated = a.activeFrom <= today && today <= a.activeTo
    console.log(`    ${a.name ?? '(untitled)'}${draft ? '   *** DRAFT, NOT PUBLISHED ***' : ''}`)
    console.log(`      tier          ${a.tier ?? '(unset)'}`)
    console.log(`      slots         ${(a.slots ?? []).join(', ') || '(none)'}`)
    console.log(`      runs          ${a.activeFrom ?? '?'} to ${a.activeTo ?? '?'}   live today: ${tick(dated)}`)
    const size = dims(a.creativeRef)
    console.log(
      `      creative      ${tick(a.hasCreative)}${size ? `, ${size[0]}x${size[1]}` : ''}`,
    )

    // Compared by shape rather than by pixels: creatives are designed at 2x, so
    // 672x560 is the correct file for a 336x280 slot.
    if (size) {
      const ratio = size[0] / size[1]
      for (const slot of a.slots ?? []) {
        const want = SIZE[slot]
        if (!want) continue
        const target = want[0] / want[1]
        if (Math.abs(ratio - target) / target > 0.02) {
          console.log(
            `      >> wrong shape for slot ${slot}, which needs ${want[0]}x${want[1]}.`,
          )
          console.log(
            `         It is scaled to fit rather than cropped, so it renders about ` +
              `${want[0]}x${Math.round(want[0] / ratio)} and may look like a rule, not an ad.`,
          )
        } else if (size[0] < want[0]) {
          console.log(
            `      >> only ${size[0]}px wide for a ${want[0]}px slot, will look soft. ` +
              `Export at ${want[0] * 2}x${want[1] * 2}.`,
          )
        }
      }
    }

    const dead = (a.slots ?? []).filter((s) => !SLOTS.includes(s))
    if (dead.length) {
      console.log(`      >> slot ${dead.join(', ')} does not exist any more and renders nowhere`)
    }
    if (draft) {
      console.log('      >> Press Publish in the Studio. Saving is not publishing.')
    }
    console.log('')
  }

  /* 3. Slot by slot, first failing reason ---------------------------- */
  console.log('  Slot by slot:\n')
  const published = ads.filter((a) => !a._id.startsWith('drafts.'))

  for (const slot of SLOTS) {
    const matching = published.filter(
      (a) =>
        (a.slots ?? []).includes(slot) &&
        a.activeFrom <= today &&
        today <= a.activeTo &&
        a.hasCreative,
    )
    // House-only mode filters paid bookings out rather than ranking them below.
    const usable = adsEnabled === 'house' ? matching.filter((a) => a.tier === 'house') : matching

    let verdict
    if (adsEnabled === 'off') verdict = 'nothing renders, adsEnabled is off'
    else if (!enabled.includes(slot)) verdict = `not in enabledSlots, add "${slot}" in Site settings`
    else if (!matching.length) verdict = 'no published booking with a creative running today'
    else if (!usable.length) verdict = 'only paid bookings match, and adsEnabled is "house" so they are withheld'
    else verdict = `SHOWS: ${usable[0].name}${usable[0].tier === 'house' ? ' (house ad)' : ''}`

    console.log(`    ${slot}   ${verdict}`)
  }

  console.log('\n  Placeholders are controlled separately, by')
  console.log('  NEXT_PUBLIC_AD_PLACEHOLDERS in web/.env.local. While it is not')
  console.log('  "false" you see labelled grey boxes even where an ad could run.\n')
}

main().catch((error) => {
  console.error(`\nDiagnosis failed: ${error.message}\n`)
  process.exit(1)
})
