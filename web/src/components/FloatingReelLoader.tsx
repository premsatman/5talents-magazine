'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import type { ReelItem } from './FloatingReelPlayer'

/**
 * Keeps the floating reel out of the first page load.
 *
 * This file is all that ships with the page: a timer and a scroll listener.
 * The player itself (and, after it, the music code) is fetched only when the
 * reader has been on the page for DELAY_MS or scrolled SCROLL_TRIGGER of the
 * way down - and never, for a reader who closed it earlier in the visit.
 */

/** The player waits this long, or until the reader scrolls this far, before sliding in. */
const DELAY_MS = 8000
const SCROLL_TRIGGER = 0.3
/** Must match CLOSED_KEY in FloatingReelPlayer.tsx (not imported, so the player stays out of this bundle). */
const CLOSED_KEY = '5t_reel_closed'

const Player = dynamic(() => import('./FloatingReelPlayer').then((m) => m.FloatingReelPlayer), { ssr: false })

export function FloatingReelLoader({ items }: { items: ReelItem[] }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLOSED_KEY) === '1') return
    } catch {}
    const show = () => setReady(true)
    const t = setTimeout(show, DELAY_MS)
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 0 && window.scrollY / max >= SCROLL_TRIGGER) show()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return ready ? <Player items={items} /> : null
}
