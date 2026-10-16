'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReelMusic } from '@/lib/reel-music'
import { reelClick, reelClose, reelNext, reelShown, reelSound, type ReelControl } from '@/lib/analytics'

export type ReelItem = {
  slug: string
  section: string
  sectionSlug: string
  href: string
  title: string
  img: string
}

/** How many stories play in the loop. */
const LOOP = 10
/** Closed stays closed for the rest of the visit (the browser tab's session). */
export const CLOSED_KEY = '5t_reel_closed'
/**
 * Pages where a corner player would get in the way: forms, where it can cover
 * a submit button on a phone. Prefix match.
 */
const HIDE_ON = ['/contact', '/write-for-us', '/advertise', '/search']

function shuffle<T>(xs: T[]): T[] {
  const a = xs.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function FloatingReelPlayer({ items }: { items: ReelItem[] }) {
  const pathname = usePathname()
  const router = useRouter()

  // Shuffled after mount, not during render, so server and client HTML agree.
  const [order, setOrder] = useState<ReelItem[] | null>(null)
  // Mounted by FloatingReelLoader only once the delay or scroll trigger has fired.
  const [visible] = useState(true)
  const [entered, setEntered] = useState(false)
  const [closed, setClosed] = useState(false)
  const [idx, setIdx] = useState(0)
  const [run, setRun] = useState(0) // bumps on every slide change; keys the animations
  const [seen, setSeen] = useState(1)
  const [paused, setPaused] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  const [sound, setSound] = useState(false)
  const [soundTouched, setSoundTouched] = useState(false)
  const music = useRef<ReelMusic | null>(null)
  const musicFactory = useRef<(() => ReelMusic) | null>(null)
  const shownSent = useRef(false)

  useEffect(() => {
    let wasClosed = false
    try {
      wasClosed = sessionStorage.getItem(CLOSED_KEY) === '1'
    } catch {}
    if (wasClosed) {
      setClosed(true)
      return
    }
    setOrder(shuffle(items))
  }, [items])

  // The story being read is never offered back to the reader.
  const list = useMemo(
    () => (order ?? []).filter((i) => i.href !== pathname).slice(0, LOOP),
    [order, pathname],
  )
  const hiddenHere = HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const cur = list.length ? list[idx % list.length] : null
  const upcoming = list.length ? list[(idx + 1) % list.length] : null

  // Fetch the music code now, in the background, so a tap on the speaker can
  // start sound synchronously. Browsers only allow audio to begin inside the
  // click itself, and an await in between can cost that permission in Safari.
  useEffect(() => {
    import('@/lib/reel-music').then((m) => {
      musicFactory.current = m.createReelMusic
    })
  }, [])

  // Slide in on the frame after mounting, so the transition actually runs.
  useEffect(() => {
    if (!visible || hiddenHere) return
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    if (!shownSent.current && list.length) {
      shownSent.current = true
      reelShown(list.length)
    }
    return () => cancelAnimationFrame(r)
  }, [visible, hiddenHere, list.length])

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Music follows the pause button and the tab, not the mouse: moving towards
  // Next should not cut the sound out.
  useEffect(() => {
    const m = music.current
    if (!m || !sound) return
    if (paused || tabHidden) m.pause()
    else m.resume()
  }, [paused, tabHidden, sound])

  useEffect(() => () => music.current?.stop(), [])

  // Warm the next picture so the cut is instant. Done off-DOM: an <img hidden>
  // is shown anyway by the global img display rule.
  const upcomingImg = upcoming?.img
  useEffect(() => {
    if (!visible || !upcomingImg) return
    const im = new Image()
    im.decoding = 'async'
    im.src = upcomingImg
  }, [visible, upcomingImg])

  const advance = useCallback(() => {
    setIdx((i) => i + 1)
    setRun((r) => r + 1)
    setSeen((s) => s + 1)
    music.current?.whoosh()
  }, [])

  if (closed || hiddenHere || !visible || !cur || !upcoming) return null

  const position = (idx % list.length) + 1
  const frozen = paused || hovering || tabHidden
  const showHint = !soundTouched && seen <= 2

  function open(control: ReelControl) {
    if (!cur) return
    reelClick({ slug: cur.slug, section: cur.sectionSlug, position, seen, control })
  }

  function onClose() {
    music.current?.stop()
    setSound(false)
    reelClose(seen)
    try {
      sessionStorage.setItem(CLOSED_KEY, '1')
    } catch {}
    setEntered(false)
    setTimeout(() => setClosed(true), 300)
  }

  async function toggleSound() {
    if (!music.current) {
      if (!musicFactory.current) musicFactory.current = (await import('@/lib/reel-music')).createReelMusic
      music.current = musicFactory.current()
    }
    const next = !sound
    if (next) {
      music.current.start()
      if (paused) music.current.pause()
    } else music.current.stop()
    setSound(next)
    setSoundTouched(true)
    reelSound(next)
  }

  const words = cur.title.split(/\s+/)

  return (
    <aside
      className={`reel${entered ? ' reel--in' : ''}${frozen ? ' reel--paused' : ''}`}
      aria-label="Latest from 5Talents"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovering(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovering(false)}
    >
      <div className="reel__bar">
        <button type="button" className="reel__close" onClick={onClose} aria-label="Close player">
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <span className="reel__by">
          Latest from <b>5TALENTS</b>
        </span>
      </div>

      <div className="reel__body">
        <Link
          href={cur.href}
          className="reel__frame"
          aria-label={`${cur.title}. Read the story`}
          onClick={(e) => open((e.target as HTMLElement).closest('.reel__read') ? 'read_story' : 'frame')}
        >
          <div key={run} className={`reel__slide${run % 2 ? ' reel__slide--alt' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- already sized by resolveMedia */}
            <img className="reel__img" src={cur.img} alt="" decoding="async" />
            <div className="reel__shade" />
            {cur.section && <span className="reel__chip">{cur.section}</span>}
            <span className="reel__read">Read story</span>
            <p className="reel__title">
              {words.map((w, i) => (
                <span className="reel__word" key={i}>
                  <span style={{ animationDelay: `${(0.75 + i * 0.07).toFixed(2)}s, 5.1s` }}>{w}</span>
                </span>
              ))}
            </p>
            <div
              className="reel__sting"
              onAnimationStart={(e) => e.animationName === 'reel-fade-in' && e.target === e.currentTarget && music.current?.chime()}
            >
              <div className="reel__mark">5TALENTS</div>
              <small>Magazine</small>
            </div>
          </div>
        </Link>

        <div className="reel__ctrls">
          <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play' : 'Pause'}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              {paused ? (
                <path d="M3 2l11 6-11 6z" fill="currentColor" />
              ) : (
                <>
                  <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
                  <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
                </>
              )}
            </svg>
          </button>
          <button
            type="button"
            className="reel__sound"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? 'Turn music off' : 'Turn music on'}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
              {sound ? (
                <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              ) : (
                <path d="M11.5 5.5l3.5 5M15 5.5l-3.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              open('expand')
              router.push(cur.href)
            }}
            aria-label="Open story"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.7" fill="none" />
            </svg>
          </button>
          {showHint ? (
            <span className="reel__hint" aria-hidden="true">
              Tap for sound
            </span>
          ) : (
            <span className="reel__count">
              {position} / {list.length}
            </span>
          )}
        </div>

        <button
          type="button"
          key={`next-${run}`}
          className="reel__next"
          onClick={() => {
            reelNext(cur.slug, position)
            advance()
          }}
        >
          Next
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <path d="M1 1l8 6-8 6z" fill="currentColor" />
            <rect x="10.5" y="1" width="2.2" height="12" fill="currentColor" />
          </svg>
        </button>

        <div className="reel__prog" aria-hidden="true">
          <i key={`p-${run}`} onAnimationEnd={advance} />
        </div>

      </div>

    </aside>
  )
}
