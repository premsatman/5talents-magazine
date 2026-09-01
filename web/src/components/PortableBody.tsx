import Image from 'next/image'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { type ImageLike } from '@/sanity/image'
import { resolveMedia, type ExternalImage } from '@/sanity/media'
import { clean } from '@/sanity/stega'
import { AdSlot } from './AdSlot'

type Block = { _type?: string; style?: string; [key: string]: unknown }

/**
 * A picture inside the article.
 *
 * Rendered at just under half the measure and centred, so it reads as an
 * illustration within the piece rather than a second hero. The hero is the
 * full-width photograph; anything below it competing at that size flattens the
 * hierarchy of the page.
 *
 * The request is 800px wide, not 1200. At 46% of a 68ch measure the image
 * paints around 320px, so 800 covers a 2x screen with room to spare - asking
 * for 1200 was serving well over twice the pixels the slot uses, on the
 * connections least able to afford them.
 */
function BodyImage({ sanity, external }: { sanity?: ImageLike; external?: ExternalImage }) {
  const media = resolveMedia(sanity, external, { width: 800 })
  if (!media) return null
  return (
    <figure className="bodyfig">
      <Image
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        sizes="(max-width: 700px) 78vw, 320px"
        placeholder={media.blur ? 'blur' : 'empty'}
        blurDataURL={media.blur}
      />
      {media.caption && <figcaption>{media.caption}</figcaption>}
    </figure>
  )
}

const components: PortableTextComponents = {
  block: {
    blockquote: ({ children }) => (
      <blockquote>
        <p>{children}</p>
      </blockquote>
    ),
  },
  marks: {
    // The brush stroke as an inline highlighter. Design system s2: restraint is
    // the whole game - one highlight per screen.
    highlight: ({ children }) => <span className="brush">{children}</span>,
    link: ({ children, value }) => {
      const href = clean((value as { href?: string } | undefined)?.href) ?? '#'
      const external = /^https?:\/\//.test(href)
      return external ? (
        <a href={href} rel="noopener noreferrer" target="_blank">
          {children}
        </a>
      ) : (
        <Link href={href}>{children}</Link>
      )
    },
  },
  types: {
    image: ({ value }) => <BodyImage sanity={value as ImageLike} />,
    // The same picture hosted on Cloudinary rather than uploaded. Renders
    // identically - see sanity/media.ts.
    externalImage: ({ value }) => <BodyImage external={value as ExternalImage} />,
    verse: ({ value }) => (
      <figure className="verse">
        <p>{(value?.text as string) ?? ''}</p>
        {value?.attribution ? <figcaption>{value.attribution as string}</figcaption> : null}
      </figure>
    ),
    /**
     * The magazine speaking, not the author. Set apart from the body so a
     * reader can tell at a glance that the voice has changed - and given
     * `role="note"` so that distinction survives for a screen reader, which
     * would otherwise hear it as another paragraph of the article.
     */
    editorsNote: ({ value }) => (
      <aside
        className={`ednote${value?.placement === 'foot' ? ' ednote--foot' : ''}`}
        role="note"
      >
        <p className="ednote__label">Editor’s note</p>
        <p>{(value?.text as string) ?? ''}</p>
      </aside>
    ),
    pullQuote: ({ value }) => {
      const quote = (value?.quote as string | undefined) ?? ''
      const phrase = (value?.highlightPhrase as string | undefined) || undefined
      // Cleaned before indexOf - a branded needle never matches a branded
      // haystack at the position you expect.
      const cleanQuote = clean(quote) ?? ''
      const cleanPhrase = phrase ? (clean(phrase) ?? '') : ''
      const index = cleanPhrase ? cleanQuote.indexOf(cleanPhrase) : -1

      return (
        <blockquote>
          <p>
            {index >= 0 && cleanPhrase ? (
              <>
                {cleanQuote.slice(0, index)}
                <span className="brush">{cleanPhrase}</span>
                {cleanQuote.slice(index + cleanPhrase.length)}
              </>
            ) : (
              quote
            )}
          </p>
          {value?.attribution && <cite>{value.attribution}</cite>}
        </blockquote>
      )
    },
  },
}

/**
 * Renders the body and injects the in-article ad slots at the positions from
 * blueprint s7: slot B after paragraph 3, slot C after paragraph 8.
 *
 * The count is of paragraphs specifically, not of blocks, so a subhead or an
 * image does not push an ad earlier than intended.
 *
 * The ad opens the chunk it belongs to rather than closing the one before it.
 * That is what lets the text wrap: a unit sitting *between* two blocks of prose
 * can only ever be a full-width band, whereas one floated at the head of the
 * following block has paragraphs running down beside it. Same position in the
 * reading order, a fraction of the vertical space.
 */
export function PortableBody({ value }: { value: unknown }) {
  const blocks = (value ?? []) as Block[]
  if (!Array.isArray(blocks) || blocks.length === 0) return null

  const chunks: { blocks: Block[]; adBefore?: 'B' | 'C' }[] = []
  let current: Block[] = []
  let paragraphs = 0
  let pending: 'B' | 'C' | undefined

  const flush = (next?: 'B' | 'C') => {
    chunks.push({ blocks: current, adBefore: pending })
    pending = next
    current = []
  }

  for (const block of blocks) {
    current.push(block)
    const isParagraph = clean(block._type) === 'block' && (clean(block.style) ?? 'normal') === 'normal'
    if (!isParagraph) continue

    paragraphs += 1
    if (paragraphs === 3) flush('B')
    else if (paragraphs === 8) flush('C')
  }
  if (current.length || pending) flush()

  return (
    <>
      {chunks.map((chunk, index) => (
        <div className={index === 0 ? 'body body--opening' : 'body'} key={index}>
          {chunk.adBefore && <AdSlot slot={chunk.adBefore} className="ad--inbody" />}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <PortableText value={chunk.blocks as any} components={components} />
        </div>
      ))}
    </>
  )
}

/** Same renderer without ad injection, for policy pages and settings prose. */
export function Prose({ value }: { value: unknown }) {
  const blocks = (value ?? []) as Block[]
  if (!Array.isArray(blocks) || blocks.length === 0) return null
  return (
    <div className="prose">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PortableText value={blocks as any} components={components} />
    </div>
  )
}
