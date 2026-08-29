'use client'

import { useEffect, useRef } from 'react'

/** The 3px yellow bar at the top of an article. From article.html. */
export function ReadingProgress() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    const tick = () => {
      frame = 0
      const h = document.documentElement.scrollHeight - window.innerHeight
      el.style.width = `${h > 0 ? (window.scrollY / h) * 100 : 0}%`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    tick()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return <div className="progress" ref={ref} aria-hidden="true" />
}
