import { sanityFetch } from '@/sanity/live'
import { FLOATING_REEL_QUERY } from '@/sanity/queries'
import { resolveMedia } from '@/sanity/media'
import { clean } from '@/sanity/stega'
import { articleHref } from '@/lib/site'
import type { ArticleCardData } from './types'
import type { ReelItem } from './FloatingReelPlayer'
import { FloatingReelLoader } from './FloatingReelLoader'

/**
 * The video-style player in the bottom-right corner of every page.
 *
 * Not a video. Each "clip" is the article's lead image, section label and
 * headline animated in CSS, so there is nothing to render, host or keep in
 * sync: publish an article and it is in the reel on the next revalidation.
 *
 * This half runs on the server and does the data work - query, image sizing,
 * stega cleaning - so the client receives a small, plain list. Strings are
 * cleaned rather than left editable: the headline is split into words for the
 * animation and used in aria-labels, where invisible stega characters would
 * break both.
 */

const IMG = { width: 720, height: 405 } // 16:9 at about 2x the 360px player

export async function FloatingReel() {
  const { data } = await sanityFetch({ query: FLOATING_REEL_QUERY })

  const items: ReelItem[] = ((data ?? []) as ArticleCardData[]).flatMap((a) => {
    const slug = clean(a.slug)
    const sectionSlug = clean(a.section?.slug)
    const title = clean(a.title)
    const media = resolveMedia(a.hero, a.heroExternal, IMG)
    if (!slug || !sectionSlug || !title || !media) return []
    return [
      {
        slug,
        section: clean(a.section?.name) ?? '',
        sectionSlug,
        href: articleHref(sectionSlug, slug),
        title,
        img: media.src,
      },
    ]
  })

  if (items.length < 2) return null
  return <FloatingReelLoader items={items} />
}
