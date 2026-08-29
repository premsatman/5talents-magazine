/**
 * Shared Sanity HTTP helpers for the seed and import scripts.
 * No dependencies - node's built-in fetch against the Sanity API.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO = join(HERE, '..', '..')

export const PROJECT = 'wdzgdrz5'
export const DATASET = 'production'
export const API = '2026-08-27'
export const base = `https://${PROJECT}.api.sanity.io/v${API}`

let AUTH = null

export async function auth() {
  if (AUTH) return AUTH
  let token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) {
    const env = await readFile(join(REPO, 'web', '.env.local'), 'utf8')
    const m = env.match(/^SANITY_API_WRITE_TOKEN\s*=\s*"?([^"\n]+)"?/m)
    if (!m) throw new Error('No SANITY_API_WRITE_TOKEN in web/.env.local')
    token = m[1]
  }
  AUTH = `Bearer ${token}`
  return AUTH
}

export async function query(groq, params = {}) {
  const url = new URL(`${base}/data/query/${DATASET}`)
  url.searchParams.set('query', groq)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, JSON.stringify(v))
  const res = await fetch(url, { headers: { Authorization: await auth() } })
  if (!res.ok) throw new Error(`Query failed ${res.status}: ${await res.text()}`)
  return (await res.json()).result
}

export async function mutate(mutations) {
  const res = await fetch(`${base}/data/mutate/${DATASET}?returnIds=true`, {
    method: 'POST',
    headers: { Authorization: await auth(), 'content-type': 'application/json' },
    body: JSON.stringify({ mutations }),
  })
  if (!res.ok) throw new Error(`Mutation failed ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function uploadImage(path, filename) {
  const existing = await query(
    '*[_type == "sanity.imageAsset" && originalFilename == $f][0]._id',
    { f: filename },
  )
  if (existing) return { id: existing, reused: true }

  const body = await readFile(path)
  const url = new URL(`${base}/assets/images/${DATASET}`)
  url.searchParams.set('filename', filename)
  const type = filename.toLowerCase().endsWith('.png')
    ? 'image/png'
    : filename.toLowerCase().endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg'
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: await auth(), 'content-type': type },
    body,
  })
  if (!res.ok) throw new Error(`Upload failed ${res.status}: ${await res.text()}`)
  return { id: (await res.json()).document._id, reused: false }
}

/** Upsert on slug rather than a slug-derived _id, per Sanity's guidance. */
export async function upsertBySlug(type, slug, fields) {
  const id = await query('*[_type == $t && slug.current == $s][0]._id', { t: type, s: slug })
  if (id) {
    await mutate([{ patch: { id, set: fields } }])
    return { id, created: false }
  }
  const result = await mutate([
    { create: { _type: type, slug: { _type: 'slug', current: slug }, ...fields } },
  ])
  return { id: result.results[0].id, created: true }
}

export async function refBySlug(type, slug) {
  const id = await query('*[_type == $t && slug.current == $s][0]._id', { t: type, s: slug })
  if (!id) throw new Error(`No ${type} with slug "${slug}" - create it first`)
  return { _type: 'reference', _ref: id }
}

/** Sanity array members need a stable _key. */
let keySeed = 0
export const key = () => `k${Date.now().toString(36)}${(keySeed++).toString(36)}`
