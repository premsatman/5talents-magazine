/**
 * Delete articles from Sanity, properly.
 *
 *   npm run drop -- <slug> [<slug>...]              show what would happen
 *   npm run drop -- <slug> [<slug>...] --confirm    do it
 *
 * Why this exists rather than deleting in the Studio:
 *
 * An imported article is referenced from its issue's `tableOfContents`, and
 * Sanity refuses to delete a document that anything still points at. Deleting
 * by hand fails with a reference error that does not say which document is
 * holding it.
 *
 * Removing an article from its seed JSON does NOT remove it from the dataset.
 * The importer only creates and updates; it has no concept of a deletion,
 * deliberately, because a file being absent should never silently unpublish
 * anything. So dropping is a separate, explicit act, and this is it.
 *
 * Three things that made the first version of this script fail:
 *
 * 1. DRAFTS. Every document can have a `drafts.<id>` twin. The draft holds its
 *    own copy of every reference, so unlinking the published issue is not
 *    enough - the draft issue still points at the article and still blocks the
 *    delete. Both have to be unlinked, and the draft article has to be deleted
 *    before the published one.
 * 2. ORDER. Unlink and delete have to happen in one transaction. Done as
 *    separate requests, a concurrent Studio session can re-save the issue
 *    between them and restore the reference.
 * 3. SILENCE. It swallowed the Sanity error and printed its own. The API says
 *    exactly which document is holding the reference; that text is worth more
 *    than anything this script can guess, so it is printed verbatim.
 *
 * `drop` is not `retract`. Retraction keeps the document and hides it behind a
 * public note, which is right when a piece was published and has to be
 * withdrawn on the record. Dropping is for a piece that should never have been
 * in the dataset: imported by mistake, or pulled before anyone saw it.
 * If in doubt, retract. Deletion is not reversible from here.
 */
import { query, mutate } from './lib.mjs'

const args = process.argv.slice(2)
const CONFIRM = args.includes('--confirm')
const slugs = args.filter((a) => !a.startsWith('--'))

if (slugs.length === 0) {
  console.error('Usage: npm run drop -- <article-slug> [<article-slug>...] [--confirm]')
  process.exit(1)
}

/** Published id for a draft id, and vice versa. */
const published = (id) => id.replace(/^drafts\./, '')
const draft = (id) => `drafts.${published(id)}`

async function inspect(slug) {
  // `*[...]` returns drafts as well as published documents, so a piece that
  // only exists as a draft is still found.
  const docs = await query(
    `*[_type == "article" && slug.current == $s]{
       _id, title, retracted, "section": section->slug.current
     }`,
    { s: slug },
  )
  if (docs.length === 0) return null

  const ids = [...new Set(docs.flatMap((d) => [published(d._id), draft(d._id)]))]
  const holders = await query(
    `*[references($ids)]{ _id, _type, "slug": slug.current, title }`,
    { ids },
  )
  return { slug, docs, ids, holders }
}

async function main() {
  const found = []
  for (const slug of slugs) {
    const info = await inspect(slug)
    if (!info) {
      console.log(`\n  ${slug}\n    not in the dataset, nothing to do`)
      continue
    }
    found.push(info)

    console.log(`\n  ${slug}`)
    for (const d of info.docs) {
      const kind = d._id.startsWith('drafts.') ? 'draft    ' : 'published'
      console.log(`    ${kind}  ${d._id}${d.retracted ? '  (retracted)' : ''}`)
      console.log(`               ${d.title}`)
    }
    if (info.holders.length === 0) {
      console.log('    nothing references it')
    } else {
      for (const h of info.holders) {
        console.log(`    held by    ${h._type}  ${h.slug ?? h._id}`)
      }
    }
  }

  if (found.length === 0) return

  if (!CONFIRM) {
    console.log('\n  Dry run. Add --confirm to unlink and delete.')
    console.log('  Consider `npm run retract` instead if this was ever publicly visible.\n')
    return
  }

  // One transaction per article: unlink every holder, then delete draft and
  // published together. Sanity applies a transaction all or nothing, so there
  // is no window in which the reference is gone but the document survives.
  for (const info of found) {
    const mutations = []

    for (const holder of info.holders) {
      if (holder._type !== 'archiveIssue') {
        throw new Error(
          `${holder._type} "${holder.slug ?? holder._id}" references ${info.slug}. ` +
            'This script only edits an issue table of contents. Remove that ' +
            'reference in the Studio, then run again.',
        )
      }
      const issue = await query('*[_id == $id][0]{ _id, tableOfContents }', { id: holder._id })
      const kept = (issue.tableOfContents ?? []).filter(
        (e) => e.article?._ref && !info.ids.includes(e.article._ref),
      )
      mutations.push({ patch: { id: issue._id, set: { tableOfContents: kept } } })
      const label = issue._id.startsWith('drafts.') ? `${holder.slug} (draft)` : holder.slug
      console.log(`\n  unlink   ${info.slug} from ${label}, ${kept.length} entries remain`)
    }

    // Draft first. Deleting the published document while its draft exists
    // leaves an orphan the Studio still lists.
    for (const d of info.docs.filter((d) => d._id.startsWith('drafts.'))) {
      mutations.push({ delete: { id: d._id } })
    }
    for (const id of info.ids.filter((i) => i.startsWith('drafts.'))) {
      mutations.push({ delete: { id } })
    }
    for (const d of info.docs.filter((d) => !d._id.startsWith('drafts.'))) {
      mutations.push({ delete: { id: d._id } })
    }

    try {
      await mutate(mutations)
      console.log(`  deleted  ${info.slug}`)
    } catch (error) {
      // The API names the document still holding the reference. That is the
      // useful part, so print it rather than a summary of it.
      console.error(`\n  FAILED   ${info.slug}`)
      console.error(`  ${error.message}\n`)
      throw error
    }
  }

  console.log('\n  Remove these from their seed JSON too, or the next import restores them.\n')
}

main().catch((error) => {
  console.error(`Drop failed: ${error.message}`)
  process.exit(1)
})
