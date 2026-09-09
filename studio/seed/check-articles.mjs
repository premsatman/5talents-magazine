/**
 * Structural checks over every article seed file.
 *
 *   npm run check
 *
 * This exists because of a specific failure on 3 September 2026. Sanjay's
 * "Seeking Wisdom" was converted from a PDF text extraction that stopped at a
 * column break, mid-argument. Nothing in the pipeline noticed, and the
 * conversion invented a closing sentence to round it off. A fabricated sentence
 * under a real contributor's byline is the worst thing this project can produce,
 * and it happened silently.
 *
 * The tell was there in the data: the last paragraph did not end in a full stop.
 * That is what TRUNCATION below looks for, and it is the check that matters most
 * here. The rest are cheap and catch the errors that have actually occurred
 * during this conversion rather than errors imagined in advance.
 *
 * Exits non-zero if anything fails, so it can gate an import.
 */
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BLOCKS = new Set(['p', 'h2', 'h3', 'quote', 'note', 'verse'])

/**
 * A sentence that was cut off rather than finished.
 *
 * Three endings are legitimate and must not be flagged, or the real signal
 * drowns in noise:
 *   - a colon, introducing the verse or quote block that follows
 *   - a scripture reference after the closing quotation mark, which is how
 *     several contributors cite ("...for his work." 1 Chron 4:23)
 *   - a closing bracket or quote
 */
const ENDS_CLEANLY = /(?:[.!?:"'’”)\]]|\b\d+:\d+(?:-\d+)?|[—-]\s*[A-Z][\w.]*(?:\s+[A-Z][\w.]*)*)\s*$/

/**
 * Words a paragraph should not end on. A body block ending in a conjunction or
 * preposition is a sentence that lost its second half somewhere in the PDF.
 */
const DANGLING = /\b(and|but|or|the|a|an|of|to|in|for|with|that|which|as|is|was|were|by|from|at|on)\s*$/i

const problems = []
const note = (file, slug, kind, detail) => problems.push({ file, slug, kind, detail })

async function main() {
  const files = (await readdir(join(HERE, 'articles'))).filter((f) => f.endsWith('.json'))
  let articles = 0

  // Authors are upserted per file, so an article may reference one declared in
  // a different file and still import - as long as that file went first. Build
  // the whole map before checking, so the only hard error is an author declared
  // nowhere at all, and a cross-file reference is reported as the ordering
  // dependency it actually is.
  const declaredIn = new Map()
  const parsed = new Map()
  for (const file of files) {
    try {
      const data = JSON.parse(await readFile(join(HERE, 'articles', file), 'utf8'))
      parsed.set(file, data)
      for (const a of data.authors ?? []) {
        if (!declaredIn.has(a.slug)) declaredIn.set(a.slug, file)
      }
    } catch (error) {
      note(file, '-', 'JSON', error.message)
    }
  }

  const unusedHere = []
  const usedAnywhere = new Set()

  for (const [file, data] of parsed) {
    const declared = new Set((data.authors ?? []).map((a) => a.slug))
    const used = new Set()

    for (const article of data.articles ?? []) {
      articles += 1
      const { slug, body = [] } = article

      for (const s of article.authors ?? []) {
        used.add(s)
        usedAnywhere.add(s)
        if (declared.has(s)) continue
        const elsewhere = declaredIn.get(s)
        if (!elsewhere) note(file, slug, 'AUTHOR', `"${s}" is declared in no file at all`)
        else note(file, slug, 'ORDERING', `"${s}" is declared in ${elsewhere}, so that file must be imported first`)
      }

      // Only archive conversions face the rights gate. A 2026 original has no
      // issue and nothing to clear.
      const isArchive = Boolean(article.issue ?? data.issue)
      if (isArchive && !article.archiveMeta?.rightsCleared) {
        note(file, slug, 'RIGHTS', 'no rightsCleared value')
      }

      const text = body.filter((b) => b.t === 'p' || b.t === 'verse')
      if (text.length === 0) note(file, slug, 'EMPTY', 'no paragraphs')

      for (const [i, b] of body.entries()) {
        if (!BLOCKS.has(b.t)) note(file, slug, 'TYPE', `unknown block type "${b.t}"`)
        if (b.t === 'note' && !['top', 'foot'].includes(b.placement)) {
          note(file, slug, 'NOTE', `placement must be top or foot, got "${b.placement}"`)
        }
        if (b.t === 'quote' && b.highlight && !b.v.includes(b.highlight)) {
          note(file, slug, 'HIGHLIGHT', `"${b.highlight}" is not inside the quote`)
        }
        // A heading is the last thing in the body: the section under it is gone.
        if ((b.t === 'h2' || b.t === 'h3') && i === body.length - 1) {
          note(file, slug, 'TRUNCATION', 'body ends on a heading with nothing under it')
        }
      }

      // The check that this file exists for.
      const last = [...body].reverse().find((b) => b.t === 'p' || b.t === 'verse')
      if (last) {
        if (!ENDS_CLEANLY.test(last.v)) {
          note(file, slug, 'TRUNCATION', `last paragraph does not end in punctuation: "...${last.v.slice(-60)}"`)
        }
        // Only meaningful when the sentence did not finish. "...what God
        // calls us to." ends on a preposition and is a complete sentence.
        if (!ENDS_CLEANLY.test(last.v) && DANGLING.test(last.v)) {
          note(file, slug, 'TRUNCATION', `last paragraph ends on a dangling word: "...${last.v.slice(-60)}"`)
        }
      }

      // Any paragraph ending mid-sentence, not only the final one - a column
      // break can drop a chunk out of the middle just as easily as off the end.
      for (const b of body) {
        if (b.t !== 'p') continue
        if (!ENDS_CLEANLY.test(b.v)) {
          note(file, slug, 'TRUNCATION', `a paragraph does not end in punctuation: "...${b.v.slice(-60)}"`)
        }
      }
    }

    for (const a of declared) {
      if (!used.has(a)) unusedHere.push([file, a])
    }
  }

  // An author declared in one file and used only in another is deliberate:
  // it is how the shared contributors are seeded. Only flag one used nowhere.
  for (const [file, slug] of unusedHere) {
    if (!usedAnywhere.has(slug)) note(file, '-', 'AUTHOR', `"${slug}" is declared but no article anywhere uses it`)
  }

  console.log(`\nChecked ${articles} articles across ${files.length} files.`)

  // ORDERING is a fact about the data, not a fault in it: shared contributors
  // are deliberately declared once and referenced from the other issues they
  // wrote for. Reported so the dependency is visible, but it must not fail a
  // gate, or the gate gets switched off and stops catching real things.
  const faults = problems.filter((p) => p.kind !== 'ORDERING')
  const notes = problems.filter((p) => p.kind === 'ORDERING')

  if (notes.length) {
    console.log(`\n${notes.length} import-order dependencies (not faults):\n`)
    for (const p of notes) console.log(`  ${p.file.padEnd(22)} ${p.slug}\n    ${p.detail}`)
  }

  if (faults.length === 0) {
    console.log('\nNo faults.\n')
    return
  }

  console.log(`\n${faults.length} problem${faults.length === 1 ? '' : 's'}:\n`)
  for (const p of faults) {
    console.log(`  ${p.kind.padEnd(11)} ${p.file}  ${p.slug}`)
    console.log(`              ${p.detail}`)
  }
  console.log('')
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
