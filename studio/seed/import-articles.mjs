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
  console.log(`\n${data.issue ?? filename.replace('.json', '') + ' (not an archive issue)'}`)

  for (const author of data.authors ?? []) {
    const { slug, ...fields } = author
    const { created } = await upsertBySlug('author', slug, fields)
    console.log(`  ${created ? 'created' : 'updated'}  author   ${author.name}`)
  }

  // A file with no `issue` holds original 2026 work rather than an archive
  // conversion. It gets no issue reference, no archive provenance line, and no
  // entry in an issue's table of contents - because it did not appear in one.
  // Keeping both kinds in the same pipeline means new articles get the same
  // rights gate and the same idempotent import as the archive does.
  //
  // An article may also name its own `issue`, overriding the file's. That is
  // what a column needs: Point of View ran on page 2 of all eighteen issues,
  // so one file holds the whole run and each piece points at the issue it
  // actually appeared in. Without this the column would have to be split
  // across eighteen files or lose its provenance entirely.
  const issueOf = (article) => article.issue ?? data.issue ?? null
  const issueRefs = new Map()
  const refForIssue = async (slug) => {
    if (!slug) return null
    if (!issueRefs.has(slug)) issueRefs.set(slug, await refBySlug('archiveIssue', slug))
    return issueRefs.get(slug)
  }

  // Contents entries, keyed by issue slug.
  const tocByIssue = new Map()
  let imported = 0
  let held = 0

  for (const article of data.articles ?? []) {
    const issueSlug = issueOf(article)
    const isArchive = Boolean(issueSlug)
    const issueRef = await refForIssue(issueSlug)
    const cleared = article.archiveMeta?.rightsCleared
    if (isArchive && cleared !== 'full' && cleared !== 'textOnly' && !FORCE) {
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
    // The same rule applies to every field an editor can set in the Studio and
    // the JSON does not mention. An import is a content update, not a factory
    // reset: anything a person chose by hand survives it unless the JSON names
    // a new value. `featured` and `sponsorTier` were being stamped flat on
    // every run, which silently cleared the homepage heroes and would have
    // stripped a paid sponsorship label off a sponsored piece.
    const now = new Date().toISOString()
    const prior = await query(
      '*[_type == "article" && slug.current == $s][0]{ publishedAt, featured, sponsorTier }',
      { s: article.slug },
    )
    const existing = prior?.publishedAt ?? null

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
      // explicitly; only then is the retraction cleared. Without this the
      // rewritten replacement would import successfully and stay invisible,
      // which is the worst of both outcomes.
      //
      // The note and timestamp are cleared through `unset` below, not by
      // setting them to undefined - see the comment on upsertBySlug.
      ...(article.retracted === false ? { retracted: false } : {}),
      // Editor's choice wins over the default. JSON still overrides both.
      featured: article.featured ?? prior?.featured ?? 'none',
      // Never hardcode this. Clearing a sponsor tier on a sponsored article
      // removes its paid-content label, which is a disclosure failure and not
      // merely a display bug.
      sponsorTier: article.sponsorTier ?? prior?.sponsorTier ?? 'none',
      interviewMeta: article.interviewMeta,
      reviewMeta: article.reviewMeta,
      archiveMeta: isArchive
        ? {
            ...article.archiveMeta,
            originalIssue: issueRef,
            republishedAt: (article.publishedAt ?? existing ?? now).slice(0, 10),
          }
        : undefined,
    },
    // A retraction note that outlives the text it described is a wrong record,
    // and a wrong record is worse than none.
    article.retracted === false ? ['retractedAt', 'retractionNote'] : [])

    if (isArchive) {
      if (!tocByIssue.has(issueSlug)) tocByIssue.set(issueSlug, [])
      tocByIssue.get(issueSlug).push({
        _key: key(),
        title: article.title,
        page: article.archiveMeta?.originalPage,
        byline: (data.authors ?? []).find((a) => a.slug === article.authors?.[0])?.name,
        article: { _type: 'reference', _ref: id },
      })
    }

    console.log(`  ${created ? 'created' : 'updated'}  article  ${article.slug}`)
    imported += 1
  }

  // Point each issue's contents at the web versions.
  //
  // This MERGES rather than replaces. It used to overwrite tableOfContents
  // wholesale, which was harmless while one file held one whole issue and
  // silently destructive the moment a second file touched the same issue - as
  // the Point of View column does for all eighteen of them. An entry is matched
  // on the article it references, so re-importing updates a row in place
  // instead of duplicating it, and entries written by other files survive.
  for (const [slug, links] of tocByIssue) {
    const issue = await query(
      '*[_type == "archiveIssue" && slug.current == $s][0]{_id, tableOfContents}',
      { s: slug },
    )
    if (!issue?._id) {
      console.log(`  SKIPPED   contents for ${slug} - no such issue`)
      continue
    }

    const incoming = new Map(links.map((l) => [l.article._ref, l]))
    const merged = (issue.tableOfContents ?? []).map((existing) => {
      const replacement = incoming.get(existing.article?._ref)
      if (!replacement) return existing
      incoming.delete(existing.article._ref)
      // Keep the original _key so the Studio does not see a row swap.
      return { ...replacement, _key: existing._key }
    })
    merged.push(...incoming.values())
    merged.sort((a, b) => (a.page ?? 999) - (b.page ?? 999))

    await mutate([{ patch: { id: issue._id, set: { tableOfContents: merged } } }])
    console.log(`  linked    ${links.length} entries into the ${slug} contents (${merged.length} total)`)
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
