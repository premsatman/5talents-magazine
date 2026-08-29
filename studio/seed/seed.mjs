/**
 * Seeds the 5Talents dataset with everything the site needs to render:
 * the six sections, the siteSettings singleton, and all 18 back issues with
 * their covers.
 *
 *   cd studio && npm run seed
 *
 * Safe to run more than once. Documents are matched on slug and patched rather
 * than duplicated, and a cover already in the asset store is reused instead of
 * re-uploaded.
 *
 * No dependencies - it talks to the Sanity HTTP API with node's built-in fetch,
 * and reads the write token straight out of web/.env.local.
 */
import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..')

const PROJECT = 'wdzgdrz5'
const DATASET = 'production'
const API = '2026-08-27'

/* ------------------------------------------------------------------ */

async function token() {
  if (process.env.SANITY_API_WRITE_TOKEN) return process.env.SANITY_API_WRITE_TOKEN
  const env = await readFile(join(REPO, 'web', '.env.local'), 'utf8')
  const match = env.match(/^SANITY_API_WRITE_TOKEN\s*=\s*"?([^"\n]+)"?/m)
  if (!match) throw new Error('No SANITY_API_WRITE_TOKEN in web/.env.local')
  return match[1]
}

const base = `https://${PROJECT}.api.sanity.io/v${API}`
let AUTH

async function query(groq, params = {}) {
  const url = new URL(`${base}/data/query/${DATASET}`)
  url.searchParams.set('query', groq)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, JSON.stringify(v))
  const res = await fetch(url, { headers: { Authorization: AUTH } })
  if (!res.ok) throw new Error(`Query failed ${res.status}: ${await res.text()}`)
  return (await res.json()).result
}

async function mutate(mutations) {
  const res = await fetch(`${base}/data/mutate/${DATASET}?returnIds=true`, {
    method: 'POST',
    headers: { Authorization: AUTH, 'content-type': 'application/json' },
    body: JSON.stringify({ mutations }),
  })
  if (!res.ok) throw new Error(`Mutation failed ${res.status}: ${await res.text()}`)
  return res.json()
}

async function uploadImage(path, filename) {
  const existing = await query(
    '*[_type == "sanity.imageAsset" && originalFilename == $f][0]._id',
    { f: filename },
  )
  if (existing) return { id: existing, reused: true }

  const body = await readFile(path)
  const url = new URL(`${base}/assets/images/${DATASET}`)
  url.searchParams.set('filename', filename)
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: AUTH, 'content-type': 'image/jpeg' },
    body,
  })
  if (!res.ok) throw new Error(`Upload failed ${res.status}: ${await res.text()}`)
  return { id: (await res.json()).document._id, reused: false }
}

/** Upsert by slug, as the Sanity guidance prefers - no slug-derived _ids. */
async function upsertBySlug(type, slug, fields) {
  const id = await query('*[_type == $t && slug.current == $s][0]._id', { t: type, s: slug })
  if (id) {
    await mutate([{ patch: { id, set: fields } }])
    return { id, created: false }
  }
  const result = await mutate([
    {
      create: {
        _type: type,
        slug: { _type: 'slug', current: slug },
        ...fields,
      },
    },
  ])
  return { id: result.results[0].id, created: true }
}

/* ------------------------------------------------------------------ */

const SECTIONS = [
  {
    slug: 'faith',
    name: 'Faith',
    ordering: 1,
    description:
      'Bible teaching, formation and theology made readable — including apologetics written for readers in their twenties rather than for a seminary common room.',
  },
  {
    slug: 'culture',
    name: 'Culture',
    ordering: 2,
    description:
      'Film, music, books and television, Christian and mainstream both. The core magazine function.',
  },
  {
    slug: 'technology',
    name: 'Technology',
    ordering: 3,
    description:
      'How technology is changing the way people read Scripture, gather and serve — and what it costs as well as what it gives.',
  },
  {
    slug: 'work-money',
    name: 'Work & money',
    ordering: 4,
    description:
      'Career, calling, personal finance and entrepreneurship — including the parts nobody writes about for Christian readers: family expectation, the first job, joint-family finances.',
  },
  {
    slug: 'wellbeing',
    name: 'Wellbeing',
    ordering: 5,
    description:
      'Mental health, burnout, singleness and relationships, written where the stigma is different from the one American publications assume.',
  },
  {
    slug: 'campus',
    name: 'Campus',
    ordering: 6,
    description:
      'Bible college and seminary voices. Student essays, and theses turned into articles people will actually read.',
  },
  {
    slug: 'heritage',
    name: 'Heritage',
    ordering: 7,
    description:
      'Indian and Global South church history — the Thomas Christian tradition, missions history, indigenous worship, festivals and regional traditions.',
  },
]

const SITE_SETTINGS = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  title: '5Talents Magazine',
  // The apostrophe is corrected here. It was wrong on all 18 printed issues.
  tagline: 'Discovering talents for God’s kingdom',
  description:
    'A magazine for young Christians, edited from India, written for the world. Culture, faith, work, wellbeing and heritage. Published since 2012.',
  mission:
    'We publish for Christians in their twenties and thirties — in India and across the diaspora — about the things that actually shape a life at that age: what to do with a gift, how to work, how to stay well, and where the church we belong to came from.',
  scopeStatement:
    '5Talents is a culture and formation magazine. We do not report news or cover political controversy.',
  adsEnabled: 'off',
  enabledSlots: ['B', 'E'],
}

/* ------------------------------------------------------------------ */

async function main() {
  AUTH = `Bearer ${await token()}`
  console.log(`Seeding ${PROJECT}/${DATASET}\n`)

  // 1. Sections -------------------------------------------------------
  for (const section of SECTIONS) {
    const { slug, ...fields } = section
    const { created } = await upsertBySlug('section', slug, fields)
    console.log(`  ${created ? 'created' : 'updated'}  section  ${slug}`)
  }

  // 2. Site settings (a true singleton - fixed _id is correct here) ----
  await mutate([{ createOrReplace: SITE_SETTINGS }])
  console.log('  written   siteSettings\n')

  // 3. Archive issues --------------------------------------------------
  const issues = JSON.parse(await readFile(join(HERE, 'issues.json'), 'utf8'))
  const covers = new Set(await readdir(join(HERE, 'covers')))

  for (const issue of issues) {
    if (!covers.has(issue.cover)) {
      console.log(`  SKIPPED   ${issue.slug} - cover ${issue.cover} not found`)
      continue
    }

    const { id: assetId, reused } = await uploadImage(
      join(HERE, 'covers', issue.cover),
      `5talents-cover-${issue.cover}`,
    )

    const { created } = await upsertBySlug('archiveIssue', issue.slug, {
      title: issue.title,
      issueNumber: issue.issueNumber,
      issueDate: issue.issueDate,
      pageCount: issue.pageCount,
      coverImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetId },
        alt: `Cover of the ${issue.title} issue of 5Talents Magazine, featuring ${issue.coverSubject}`,
      },
    })

    console.log(
      `  ${created ? 'created' : 'updated'}  issue ${String(issue.issueNumber).padStart(2)}  ` +
        `${issue.title.padEnd(16)} ${reused ? '(cover reused)' : '(cover uploaded)'}`,
    )
  }

  console.log(`\nDone. ${issues.length} issues, ${SECTIONS.length} sections.`)
  console.log('Next: open http://localhost:3000/archive')
}

main().catch((error) => {
  console.error(`\nSeed failed: ${error.message}`)
  process.exit(1)
})
