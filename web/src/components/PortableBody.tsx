import Image from 'next/image'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { type ImageLike } from '@/sanity/image'
import { resolveMedia, type ExternalImage } from '@/sanity/media'
import { clean } from '@/sanity/stega'
import { AdSlot } from './AdSlot'

type Block = { _type?: string; style?: string; [key: string]: unknown }

function BodyImage({ sanity, external }: { sanity?: ImageLike; external?: ExternalImage }) {
  const media = resolveMedia(sanity, external, { width: 1200 })
  if (!media) return null
  return (
    <figure>
      <Image
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        sizes="(max-width: 720px) 100vw, 720px"
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
 */
export function PortableBody({ value }: { value: unknown }) {
  const blocks = (value ?? []) as Block[]
  if (!Array.isArray(blocks) || blocks.length === 0) return null

  const chunks: { blocks: Block[]; adAfter?: 'B' | 'C' }[] = []
  let current: Block[] = []
  let paragraphs = 0

  for (const block of blocks) {
    current.push(block)
    const isParagraph = clean(block._type) === 'block' && (clean(block.style) ?? 'normal') === 'normal'
    if (!isParagraph) continue

    paragraphs += 1
    if (paragraphs === 3) {
      chunks.push({ blocks: current, adAfter: 'B' })
      current = []
    } else if (paragraphs === 8) {
      chunks.push({ blocks: current, adAfter: 'C' })
      current = []
    }
  }
  if (current.length) chunks.push({ blocks: current })

  return (
    <>
      {chunks.map((chunk, index) => (
        <div key={index}>
          <div className={index === 0 ? 'body body--opening' : 'body'}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <PortableText value={chunk.blocks as any} components={components} />
          </div>
          {chunk.adAfter && <AdSlot slot={chunk.adAfter} />}
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
