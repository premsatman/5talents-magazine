/**
 * Re-extracts text and images from an issue PDF.
 *
 *   cd studio && npm run extract -- "../Final July 2012.pdf" july-2012
 *
 * The text for all eighteen issues is already in seed/extracted/, so you only
 * need this when you want the images out of a specific issue, or when a PDF
 * changes.
 *
 * Requires poppler:  brew install poppler
 *
 * Two text modes are produced because they fail differently:
 *
 *   extracted/<slug>.txt         default mode. Rejoins hyphenated words and
 *                                usually gets reading order right within a
 *                                column. Use this for body copy.
 *
 *   extracted/layout/<slug>.txt  -layout mode. Preserves the spatial
 *                                arrangement, so contents pages and anything
 *                                in a grid stay readable. Keeps hyphenation
 *                                breaks, so it is worse for body copy.
 *
 * Neither is right on its own for a two-column spread with an image between
 * the columns - that is the case that needs a human, and the reason the
 * cleanup is measured in minutes per article rather than seconds.
 */
import { execFile } from 'node:child_process'
import { mkdir, readdir, stat, unlink } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const HERE = dirname(fileURLToPath(import.meta.url))

const [pdfArg, slug] = process.argv.slice(2)
if (!pdfArg || !slug) {
  console.error('Usage: npm run extract -- <path-to.pdf> <issue-slug>')
  process.exit(1)
}
const pdf = resolve(process.cwd(), pdfArg)

async function needPoppler() {
  try {
    await run('pdftotext', ['-v'])
  } catch {
    console.error('poppler not found. Install it with:  brew install poppler')
    process.exit(1)
  }
}

async function main() {
  await needPoppler()
  await stat(pdf)

  const textDir = join(HERE, 'extracted')
  const layoutDir = join(textDir, 'layout')
  const imgDir = join(HERE, 'extracted', 'images', slug)
  await mkdir(layoutDir, { recursive: true })
  await mkdir(imgDir, { recursive: true })

  await run('pdftotext', [pdf, join(textDir, `${slug}.txt`)])
  await run('pdftotext', ['-layout', pdf, join(layoutDir, `${slug}.txt`)])
  console.log(`text     -> seed/extracted/${slug}.txt (+ layout/)`)

  // Embedded images, at their original resolution and without any text overlay.
  await run('pdfimages', ['-j', pdf, join(imgDir, 'img')])

  // Drop the background textures, gradients and masks that the layout used.
  // Anything under 250px on a side was furniture, not a photograph.
  let kept = 0
  for (const file of await readdir(imgDir)) {
    const { size } = await stat(join(imgDir, file))
    if (size < 12000) {
      await unlink(join(imgDir, file))
      continue
    }
    kept += 1
  }
  console.log(`images   -> seed/extracted/images/${slug}/ (${kept} kept)`)
  console.log('\nReview the images by eye - roughly half of what survives the size')
  console.log('filter is still background texture rather than photography.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
