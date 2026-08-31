/**
 * Imports cleaned archive articles into Sanity.
 *
 *   cd studio && npm run import                    # every file in seed/articles
 *   cd studio && npm run import july-2012          # one issue
 *
 * Reads seed/articles/<issue>.json, uploads any hero images from
 * seed/article-images/, creates the authors and tags the articles reference,
 * creates the articles themselves, and links each one back into its issue's
 * table of contents so the archive browser points at the web version.
 *
 * Safe to run repeatedly - everything is matched on slug and patched.
 *
 * ---------------------------------------------------------------------------
 * The rights gate
 *
 * Nothing is imported unless archiveMeta.rightsCleared says the rights were
 * checked. Blueprint section 1: text rights and image rights are separate
 * questions, and photographs in those issues may have been licensed for the
 * print run only. Making this a hard gate rather than a note is the same
 * reasoning as sponsorTier driving the disclosure label - a check that depends
 * on someone remembering will eventually be forgotten.
 *
 * Pass --force to override, deliberately, for one run.
 * ---------------------------------------------------------------------------
 */
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { key, mutate, query, refBySlug, upsertBySlug, uploadImage } from './lib.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const FORCE = process.argv.includes('--force')
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'))

/* ---- Portable Text -------------------------------------------------- */

function span(text) {
  return { _type: 'span', _key: key(), text, marks: [] }
}

/** Splits a string on a phrase and marks the phrase with the brush highlight. */
function highlighted(text, phrase) {
  const i = phrase ? text.indexOf(phrase) : -1
  if (i < 0) return [span(text)]
  return [
    ...(i > 0 ? [span(text.slice(0, i))] : []),
    { _type: 'span', _key: key(), text: phrase, marks: ['highlight'] },
    ...(i + phrase.length < text.length ? [span(text.slice(i + phrase.length))] : []),
  ]
}

function toPortableText(blocks) {
  return blocks.map((b) => {
    if (b.t === 'verse') {
      return { _type: 'verse', _key: key(), text: b.v, attribution: b.attr ?? undefined }
    }
    if (b.t === 'note') {
      return {
        _type: 'editorsNote',
        _key: key(),
        text: b.v,
        placement: b.placement ?? 'top',
      }
    }
    if (b.t === 'quote') {
      return {
        _type: 'pullQuote',
        _key: key(),
        quote: b.v,
        attribution: b.attr ?? undefined,
        highlightPhrase: b.highlight ?? undefined,
      }
    }
    return {
      _type: 'block',
      _key: key(),
      style: b.t === 'h2' ? 'h2' : b.t === 'h3' ? 'h3' : 'normal',
      markDefs: [],
      children: b.highlight ? highlighted(b.v, b.highlight) : [span(b.v)],
    }
  })
}

/* ---- Import ---------------------------------------------------------- */

async function ensureTag(slug) {
  const name = slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())
  await upsertBySlug('tag', slug, { name })
  return refBySlug('tag', slug)
}

async function importFile(filename) {
  const data = JSON.parse(await readFile(join(HERE, 'articles', filename), 'utf8'))
  console.log(`\n${data.issue}`)

  for (const author of data.authors ?? []) {
    const { slug, ...fields } = author
    const { created } = await upsertBySlug('author', slug, fields)
    console.log(`  ${created ? 'created' : 'updated'}  author   ${author.name}`)
  }

  const issueRef = await refBySlug('archiveIssue', data.issue)
  const tocLinks = []
  let imported = 0
  let held = 0

  for (const article of data.articles ?? []) {
    const cleared = article.archiveMeta?.rightsCleared
    if (cleared !== 'full' && cleared !== 'textOnly' && !FORCE) {
      console.log(`  HELD      ${article.slug} - rights not cleared (${cleared ?? 'unset'})`)
      held += 1
      continue
    }

    let hero
    let heroExternal
    // A Cloudinary URL in the JSON skips the upload entirely.
    if (article.heroExternal?.url) {
      heroExternal = { _type: 'externalImage', ...article.heroExternal }
    }
    if (article.hero?.file) {
      const { id, reused } = await uploadImage(
        join(HERE, 'article-images', article.hero.file),
        article.hero.file,
      )
      hero = {
        _type: 'image',
        asset: { _type: 'reference', _ref: id },
        alt: article.hero.alt,
        credit: article.hero.credit,
        caption: article.hero.caption,
      }
      if (!reused) console.log(`  uploaded  image    ${article.hero.file}`)
    }

    const authors = []
    for (const slug of article.authors ?? []) authors.push({ ...(await refBySlug('author', slug)), _key: key() })

    const tags = []
    for (const slug of article.tags ?? []) tags.push({ ...(await ensureTag(slug)), _key: key() })

    // Re-running an import must not re-date the piece.
    //
    // publishedAt drives the homepage order and the "new" signal, so stamping
    // it with the current time on every run would shove whatever was imported
    // most recently back to the top - and silently reorder the site every time
    // a typo gets fixed. An existing date wins over a fresh one; the JSON can
    // still override both by setting publishedAt explicitly.
    const now = new Date().toISOString()
    const existing = await query(
      '*[_type == "article" && slug.current == $s][0].publishedAt',
      { s: article.slug },
    )

    const { id, created } = await upsertBySlug('article', article.slug, {
      title: article.title,
      deck: article.deck,
      kind: article.kind,
      section: await refBySlug('section', article.section),
      authors,
      tags,
      hero,
      heroExternal,
      body: toPortableText(article.body ?? []),
      // Blueprint section 7: publishedAt carries the freshness signal, the
      // original issue date is displayed prominently from archiveMeta.
      publishedAt: article.publishedAt ?? existing ?? now,
      // Bringing a retracted piece back is a deliberate act, never a side
      // effect of re-importing. The JSON has to say `"retracted": false`
      // explicitly; only then is the retraction and its note cleared. Without
      // this the rewritten replacement would import successfully and stay
      // invisible, which is the worst of both outcomes.
      ...(article.retracted === false
        ? { retracted: false, retractedAt: undefined, retractionNote: undefined }
        : {}),
      featured: article.featured ?? 'none',
      sponsorTier: 'none',
      interviewMeta: article.interviewMeta,
      reviewMeta: article.reviewMeta,
      archiveMeta: {
        ...article.archiveMeta,
        originalIssue: issueRef,
        republishedAt: (article.publishedAt ?? existing ?? now).slice(0, 10),
      },
    })

    tocLinks.push({
      _key: key(),
      title: article.title,
      page: article.archiveMeta?.originalPage,
      byline: (data.authors ?? []).find((a) => a.slug === article.authors?.[0])?.name,
      article: { _type: 'reference', _ref: id },
    })

    console.log(`  ${created ? 'created' : 'updated'}  article  ${article.slug}`)
    imported += 1
  }

  // Point the issue's contents at the web versions.
  if (tocLinks.length) {
    const issueId = await query('*[_type == "archiveIssue" && slug.current == $s][0]._id', {
      s: data.issue,
    })
    await mutate([{ patch: { id: issueId, set: { tableOfContents: tocLinks } } }])
    console.log(`  linked    ${tocLinks.length} entries into the ${data.issue} contents`)
  }

  return { imported, held }
}

async function main() {
  const files = (await readdir(join(HERE, 'articles')))
    .filter((f) => f.endsWith('.json'))
    .filter((f) => ONLY.length === 0 || ONLY.includes(f.replace('.json', '')))

  if (files.length === 0) {
    console.log('Nothing to import.')
    return
  }

  let imported = 0
  let held = 0
  for (const file of files) {
    const result = await importFile(file)
    imported += result.imported
    held += result.held
  }

  console.log(`\n${imported} imported, ${held} held for rights.`)
  if (held) console.log('Held pieces stay out until archiveMeta.rightsCleared is set. --force overrides.')
}

main().catch((error) => {
  console.error(`\nImport failed: ${error.message}`)
  process.exit(1)
})
