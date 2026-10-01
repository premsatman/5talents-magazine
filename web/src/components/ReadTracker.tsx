'use client'

import { useEffect, useRef } from 'react'
import { articleComplete } from '@/lib/analytics'

/**
 * An invisible marker placed right after the article body. When a reader
 * scrolls it into view, they reached the end of the piece: fire
 * articleComplete once (GA4 `article_complete` + Meta `ArticleRead`).
 *
 * Why the end of the body and not a timer: "read to the end" is the audience
 * worth retargeting, and it is the same signal GA4 already reports on.
 */
export function ReadTracker({ slug, section }: { slug: string; section: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    let sent = false
    const io = new IntersectionObserver((entries) => {
      if (!sent && entries.some((e) => e.isIntersecting)) {
        sent = true
        articleComplete(slug, section)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [slug, section])

  return <div ref={ref} aria-hidden="true" style={{ height: 1 }} />
}
