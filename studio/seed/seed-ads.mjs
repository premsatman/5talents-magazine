/**
 * Fills every ad slot with a dummy creative, so the pages can be judged with
 * advertising in them rather than around a gap.
 *
 *   cd studio && npm run seed:ads          # book all eight slots
 *   cd studio && npm run seed:ads -- --off # switch them back off
 *
 * The creatives are in seed/ad-creatives/, generated at the exact reserved
 * dimensions and stamped "DUMMY" in the corner so nobody mistakes one for a
 * real booking. The advertisers are invented and their click-throughs point at
 * example.com.
 *
 * ---------------------------------------------------------------------------
 * This is a preview state, not a launch state
 *
 * It sets siteSettings.adsEnabled to "all" and turns on every slot including
 * A, the 970x250 billboard above the fold. Blueprint section 7 is emphatic
 * about that one, and 250px of above-fold height is a direct hit on LCP and
 * CLS - roughly three times the exposure the 728x90 had.
 *
 * `--off` returns you to the launch default: adsEnabled "off", slots B and E.
 * You can also do it by hand in Site settings in the Studio.
 * ---------------------------------------------------------------------------
 */
import { readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mutate, query, uploadImage } from './lib.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OFF = process.argv.includes('--off')

/** Matches the AD_SIZES table in web/src/lib/media.ts. */
const BOOKINGS = [
  { slot: 'A', name: 'Serampore College',  tier: 'partner',   alt: 'Serampore College — study theology where Carey started. MTh applications open for the 2027 intake.' },
  { slot: 'B', name: 'Lectio Press',       tier: 'supporter', alt: 'Lectio Press — new, the Thomas Christian Reader.' },
  { slot: 'C', name: 'Kairos Coffee',      tier: 'supporter', alt: 'Kairos Coffee — roasted in Coorg, shipped everywhere.' },
  { slot: 'D', name: 'Hosanna Sound',      tier: 'sponsor',   alt: 'Hosanna Sound — every mic your worship team will ever need. Free delivery across India on orders over Rs 5,000.' },
  { slot: 'E', name: 'Maranatha Tours',    tier: 'supporter', alt: 'Maranatha Tours — walk where Paul walked. Greece and Turkey, March 2027.' },
  { slot: 'F', name: 'Shiloh Financial',   tier: 'sponsor',   alt: 'Shiloh Financial — your first salary deserves a plan, not a panic.' },
  { slot: 'G', name: 'The Upper Room',     tier: 'partner',   alt: 'The Upper Room — a retreat house in the Nilgiris. Silent weekends, September onward.' },
  { slot: 'H', name: '5Talents — write for us', tier: 'house', alt: '5Talents — write for us. Pitches from students and first-timers welcome.' },
  { slot: 'I', name: 'Ananda Seeds',       tier: 'supporter', alt: 'Ananda Seeds — grow something this season. Heirloom kitchen-garden seed, posted anywhere in India.' },
  { slot: 'J', name: 'Bethel Books',       tier: 'supporter', alt: 'Bethel Books — ten years of back issues. Secondhand theology, Hyderabad, free pickup.' },
]

const ALL_SLOTS = BOOKINGS.map((b) => b.slot)

async function upsertAdvertiser(slug, fields) {
  // advertiser has no slug field, so match on name.
  const id = await query('*[_type == "advertiser" && name == $n][0]._id', { n: fields.name })
  if (id) {
    await mutate([{ patch: { id, set: fields } }])
    return { id, created: false }
  }
  const res = await mutate([{ create: { _type: 'advertiser', ...fields } }])
  return { id: res.results[0].id, created: true }
}

async function main() {
  if (OFF) {
    await mutate([
      { patch: { id: 'siteSettings', set: { adsEnabled: 'off', enabledSlots: ['B', 'E'] } } },
    ])
    console.log('Ads switched off. Slots B and E remain configured but nothing renders.')
    console.log('The advertiser documents are left in place - delete them in the Studio if you want them gone.')
    return
  }

  const files = await readdir(join(HERE, 'ad-creatives'))
  const today = new Date()
  const activeFrom = today.toISOString().slice(0, 10)
  const activeTo = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10)

  console.log('Booking every slot with dummy creatives\n')

  for (const booking of BOOKINGS) {
    const file = files.find((f) => f.startsWith(`slot-${booking.slot.toLowerCase()}-`))
    if (!file) {
      console.log(`  SKIPPED  slot ${booking.slot} - no creative in seed/ad-creatives/`)
      continue
    }

    const { id: assetId, reused } = await uploadImage(join(HERE, 'ad-creatives', file), file)

    const { created } = await upsertAdvertiser(booking.slot, {
      name: booking.name,
      tier: booking.tier,
      url: 'https://example.com/5talents-dummy-ad',
      slots: [booking.slot],
      activeFrom,
      activeTo,
      creative: {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetId },
        alt: booking.alt,
      },
      notes: 'Dummy booking created by seed-ads.mjs so the layout can be reviewed with ads in place. Not a real advertiser. Delete before launch.',
    })

    console.log(
      `  ${created ? 'created' : 'updated'}  slot ${booking.slot}  ${booking.name.padEnd(28)} ` +
        `${file.split('-').slice(2).join('-').replace('.png', '').padStart(8)}  ${reused ? '(reused)' : '(uploaded)'}`,
    )
  }

  await mutate([
    { patch: { id: 'siteSettings', set: { adsEnabled: 'all', enabledSlots: ALL_SLOTS } } },
  ])

  console.log(`\nAll ${ALL_SLOTS.length} slots live. Reload the site.`)
  console.log('Slot A is the 970x250 billboard above the fold - see the note at the top of this file.')
  console.log('Slots I and J are the gutter skyscrapers; they only appear above 1500px wide.')
  console.log('Run `npm run seed:ads -- --off` to go back to the launch default.')
}

main().catch((error) => {
  console.error(`\nAd seeding failed: ${error.message}`)
  process.exit(1)
})
