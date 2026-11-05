'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { pushDismissed, pushPromptShown, pushSubscribed, type PushSource } from '@/lib/analytics'

/**
 * Browser push: the slide-in on articles and the bell in the footer.
 *
 * Rules that are not negotiable, because getting them wrong is how a site
 * loses the permission for good:
 *
 *   - Notification.requestPermission() is called ONLY from the click handler
 *     on our own Allow button. Never on load, never on scroll. A reader who
 *     is shown the browser's dialog cold says No, and No is permanent per
 *     origin - there is no second ask, ever, on that device.
 *   - The service worker is registered at that same moment, not before. A
 *     reader who never subscribes never pays for the registration, which is
 *     the whole reason this is not OneSignal.
 *   - The card is shown at most once every fourteen days, counted from the
 *     moment it appears. Not now is not a No. Asking again on the next
 *     article, or tomorrow, would make it one.
 *
 * iOS: Safari delivers web push only to a site installed on the home screen.
 * In a normal iPhone tab PushManager exists but subscribing fails, so the UI
 * stays hidden rather than offering something that cannot work.
 */

const DISMISS_KEY = '5t_push_dismissed'
const DISMISS_DAYS = 14
const SCROLL_TRIGGER = 0.6

type Status = 'unsupported' | 'idle' | 'working' | 'subscribed' | 'denied'

/** localStorage throws in a few browsers' private modes; nothing here matters
 *  enough to take the page down with it. */
function readDismissed(): number {
  try {
    return Number(window.localStorage.getItem(DISMISS_KEY)) || 0
  } catch {
    return 0
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

/**
 * The VAPID public key is base64url; applicationServerKey wants bytes.
 *
 * Built on an ArrayBuffer explicitly rather than with Uint8Array.from, which
 * infers ArrayBufferLike and will not satisfy BufferSource under the current
 * lib.dom typings.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const raw = window.atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function usePush(source: PushSource) {
  const [status, setStatus] = useState<Status>('unsupported')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return
    }
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return
    // An iPhone outside an installed home-screen app cannot do this at all.
    if (isIos() && !isStandalone()) return

    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    let cancelled = false
    // getRegistration, not register: checking must not install the worker on
    // a reader who has not asked for anything.
    navigator.serviceWorker
      .getRegistration('/')
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled) setStatus(sub ? 'subscribed' : 'idle')
      })
      .catch(() => {
        if (!cancelled) setStatus('idle')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const subscribe = useCallback(async () => {
    setStatus('working')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        pushSubscribed(source, permission === 'denied' ? 'denied' : 'failed')
        setStatus(permission === 'denied' ? 'denied' : 'idle')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
          ),
        }))

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON(), source }),
      })
      if (!res.ok) throw new Error(String(res.status))

      pushSubscribed(source, 'granted')
      setStatus('subscribed')
    } catch {
      pushSubscribed(source, 'failed')
      setStatus('idle')
    }
  }, [source])

  const unsubscribe = useCallback(async () => {
    setStatus('working')
    try {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {})
        await subscription.unsubscribe()
      }
    } catch {
      /* fall through - the UI should still return to idle */
    }
    setStatus('idle')
  }, [])

  return { status, subscribe, unsubscribe }
}

/* ------------------------------------------------------------- slide-in -- */

/**
 * Shown once the reader has scrolled about 60% of the way down an article.
 * Someone who is still reading is the only person worth asking, and a short
 * article that already fits on screen is not that person.
 *
 * Opening the card starts the fourteen-day pause. Waiting for Not now meant
 * the next article asked again, which is the same as asking all the time.
 */
export function PushSlideIn({ slug }: { slug: string }) {
  const { status, subscribe } = usePush('article-slidein')
  const [open, setOpen] = useState(false)
  const shown = useRef(false)

  useEffect(() => {
    if (status !== 'idle') return
    if (Date.now() - readDismissed() < DISMISS_DAYS * 24 * 60 * 60 * 1000) return

    const handleScroll = () => {
      if (window.scrollY < 1) return
      const scrolled = window.scrollY + window.innerHeight
      const total = document.documentElement.scrollHeight
      if (total > 0 && scrolled / total >= SCROLL_TRIGGER) {
        setOpen(true)
        window.removeEventListener('scroll', handleScroll)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [status])

  useEffect(() => {
    if (open && !shown.current) {
      shown.current = true
      writeDismissed()
      pushPromptShown('article-slidein', slug)
    }
  }, [open, slug])

  if (!open || (status !== 'idle' && status !== 'working')) return null

  return (
    <div className="pushcard" role="dialog" aria-labelledby="pushcard-title">
      <p className="pushcard__title" id="pushcard-title">
        Get the day&rsquo;s story
      </p>
      <p className="pushcard__line">
        One notification a day, when the new piece goes up. No more than that.
      </p>
      <p className="pushcard__actions">
        <button type="button" className="btn" onClick={subscribe} disabled={status === 'working'}>
          {status === 'working' ? 'One moment' : 'Allow'}
        </button>
        <button
          type="button"
          className="pushcard__no"
          onClick={() => {
            writeDismissed()
            pushDismissed('article-slidein')
            setOpen(false)
          }}
        >
          Not now
        </button>
      </p>
    </div>
  )
}

/* ----------------------------------------------------------------- bell -- */

/** In the footer, for someone who went looking for it. */
export function PushBell() {
  const { status, subscribe, unsubscribe } = usePush('footer-bell')
  if (status === 'unsupported' || status === 'denied') return null

  const on = status === 'subscribed'
  return (
    <button
      type="button"
      className="pushbell"
      onClick={on ? unsubscribe : subscribe}
      disabled={status === 'working'}
      aria-pressed={on}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor">
        <path d="M12 2a1.2 1.2 0 0 1 1.2 1.2v.72A6 6 0 0 1 18 9.8V14l1.6 2.6a.8.8 0 0 1-.68 1.2H5.08a.8.8 0 0 1-.68-1.2L6 14V9.8a6 6 0 0 1 4.8-5.88V3.2A1.2 1.2 0 0 1 12 2Zm2.3 17.2a2.4 2.4 0 0 1-4.6 0Z" />
        {!on && <path d="M3.6 2.9 21.1 20.4l-1.2 1.2L2.4 4.1Z" />}
      </svg>
      {on ? 'Notifications on' : 'Notify me of new stories'}
    </button>
  )
}
