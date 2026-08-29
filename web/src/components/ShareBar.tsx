'use client'

import { useEffect, useState } from 'react'

/**
 * Share bar.
 *
 * Two things worth knowing about how this is built.
 *
 * **Instagram, Snapchat and TikTok have no web share URL.** None of them accept
 * a link the way WhatsApp or X do — there is no `instagram.com/share?url=`, and
 * anything claiming otherwise is a redirect that will break. The only real way
 * to reach them is the device's own share sheet, which is what the first button
 * is: `navigator.share()`. On a phone that one button covers every app the
 * reader has installed. It is hidden on desktop, where the API does not exist.
 *
 * **WhatsApp is listed first among the explicit buttons**, not X. For an
 * audience in India and the Gulf diaspora it is the channel that actually
 * carries an article, by a wide margin.
 *
 * Icons are inline SVG — no icon package, nothing loaded from a third party,
 * and no request that would tell a social network who read the page.
 */

type Props = { url: string; title: string; deck?: string | null }

const Icon = ({ d, viewBox = '0 0 24 24' }: { d: string; viewBox?: string }) => (
  <svg viewBox={viewBox} width="17" height="17" aria-hidden="true" fill="currentColor">
    <path d={d} />
  </svg>
)

const PATHS = {
  whatsapp:
    'M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06 0 1.21.89 2.39 1.01 2.55.12.17 1.74 2.66 4.22 3.73.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z',
  x: 'M18.9 2.5h3.3l-7.2 8.2 8.5 11.3h-6.7l-5.2-6.9-6 6.9H2.3l7.7-8.8L1.8 2.5h6.8l4.7 6.3 5.6-6.3Zm-1.2 17.6h1.8L7.4 4.3H5.4l12.3 15.8Z',
  facebook:
    'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z',
  linkedin:
    'M6.94 5.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.2 8.9h3.5V21H3.2V8.9Zm5.7 0h3.36v1.65h.05c.47-.85 1.6-1.75 3.3-1.75 3.53 0 4.18 2.2 4.18 5.07V21h-3.5v-5.42c0-1.29-.02-2.95-1.86-2.95-1.86 0-2.14 1.4-2.14 2.85V21H8.9V8.9Z',
  telegram:
    'M21.9 4.3 18.6 20c-.25 1.1-.9 1.37-1.82.85l-5.03-3.7-2.43 2.33c-.27.27-.5.5-1.01.5l.36-5.12L18 6.4c.4-.36-.09-.56-.63-.2L6.15 13.3l-4.96-1.55c-1.08-.34-1.1-1.08.22-1.6L20.5 2.7c.9-.33 1.68.2 1.4 1.6Z',
  email:
    'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.1L4.2 6.8v10.4h15.6V6.8L12 12.1Zm0-2.1 7.5-5H4.5L12 10Z',
  link: 'M9.88 15.53a1 1 0 0 1-1.41 0l-.24-.24a4.5 4.5 0 0 1 0-6.36l2.6-2.6a4.5 4.5 0 0 1 6.36 6.36l-1.2 1.2a1 1 0 1 1-1.41-1.42l1.2-1.2a2.5 2.5 0 0 0-3.54-3.53l-2.6 2.6a2.5 2.5 0 0 0 0 3.53l.24.25a1 1 0 0 1 0 1.41Zm4.24-7.06a1 1 0 0 1 1.41 0l.24.24a4.5 4.5 0 0 1 0 6.36l-2.6 2.6a4.5 4.5 0 1 1-6.36-6.36l1.2-1.2a1 1 0 0 1 1.41 1.42l-1.2 1.2a2.5 2.5 0 0 0 3.54 3.53l2.6-2.6a2.5 2.5 0 0 0 0-3.53l-.24-.25a1 1 0 0 1 0-1.41Z',
  share:
    'M18 16.08a2.9 2.9 0 0 0-1.96.77L8.9 12.7c.05-.23.08-.46.08-.7s-.03-.47-.08-.7l7.06-4.11c.5.47 1.17.76 1.9.76a2.92 2.92 0 1 0-2.92-2.92c0 .24.03.47.08.7L7.98 9.84a2.92 2.92 0 1 0 0 4.32l7.12 4.15c-.05.21-.08.43-.08.65a2.85 2.85 0 1 0 2.98-2.88Z',
}

export function ShareBar({ url, title, deck }: Props) {
  const [nativeShare, setNativeShare] = useState(false)
  const [copied, setCopied] = useState(false)

  // navigator.share only exists in a secure context and mostly on mobile, so
  // the button is rendered after mount rather than guessed on the server.
  useEffect(() => {
    setNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)

  const links = [
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}` },
    { key: 'x', label: 'X', href: `https://x.com/intent/post?text=${t}&url=${u}` },
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}` },
    {
      key: 'email',
      label: 'Email',
      href: `mailto:?subject=${t}&body=${encodeURIComponent(`${deck ? deck + '\n\n' : ''}${url}`)}`,
    },
  ] as const

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Clipboard access is blocked in some contexts. Nothing useful to do
      // beyond leaving the link visible in the address bar.
    }
  }

  return (
    <div className="share">
      <span className="share__label">Share</span>

      <ul className="share__list">
        {nativeShare && (
          <li>
            <button
              type="button"
              className="share__btn"
              onClick={() => navigator.share({ title, text: deck ?? undefined, url }).catch(() => {})}
            >
              <Icon d={PATHS.share} />
              <span className="visually-hidden">Share — opens your device share sheet</span>
            </button>
          </li>
        )}

        {links.map((l) => (
          <li key={l.key}>
            <a
              className={`share__btn share__btn--${l.key}`}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon d={PATHS[l.key]} />
              <span className="visually-hidden">Share on {l.label}</span>
            </a>
          </li>
        ))}

        <li>
          <button type="button" className="share__btn" onClick={copy}>
            <Icon d={PATHS.link} />
            <span className="visually-hidden">Copy link</span>
          </button>
        </li>
      </ul>

      <span className="share__copied" role="status" aria-live="polite">
        {copied ? 'Link copied' : ''}
      </span>
    </div>
  )
}
