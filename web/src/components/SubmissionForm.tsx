'use client'

import Script from 'next/script'
import { useState } from 'react'
import { SECTION_SLUGS } from '@/lib/sections'

const SECTION_LABELS: Record<string, string> = {
  faith: 'Faith',
  culture: 'Culture',
  'work-money': 'Work & money',
  wellbeing: 'Wellbeing',
  campus: 'Campus',
  heritage: 'Heritage',
}

/**
 * The public pitch form.
 *
 * Blueprint s7: a public form cannot write to Sanity from the browser without
 * exposing a write token, so this posts to a server route handler that holds
 * the token. The route also does the rate limiting and the Turnstile check;
 * the honeypot below is the first line.
 */
export function SubmissionForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setState('sending')

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      })
      const body = (await res.json()) as { message?: string }
      if (!res.ok) throw new Error(body.message ?? 'Something went wrong.')
      setState('done')
      setMessage(body.message ?? 'Pitch received.')
      form.reset()
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    }
  }

  if (state === 'done') {
    return (
      <p className="formnote ok">
        {message} We read everything and reply to what we can commission, usually within two weeks.
      </p>
    )
  }

  return (
    <>
      {siteKey && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      )}

      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="s-name">Your name</label>
          <input id="s-name" name="name" type="text" required maxLength={120} />
        </div>

        <div className="field">
          <label htmlFor="s-email">Email</label>
          <input id="s-email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="field">
          <label htmlFor="s-country">Where you are writing from</label>
          <input id="s-country" name="country" type="text" maxLength={80} />
        </div>

        <div className="field">
          <label htmlFor="s-institution">Bible college, seminary, church or employer</label>
          <input id="s-institution" name="institution" type="text" maxLength={160} />
          <p className="hint">Optional, but it helps if you are pitching to Campus.</p>
        </div>

        <div className="field">
          <label htmlFor="s-section">Which section</label>
          <select id="s-section" name="proposedSection" defaultValue="">
            <option value="">Not sure</option>
            {SECTION_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {SECTION_LABELS[slug] ?? slug}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="s-title">Working title</label>
          <input id="s-title" name="pitchTitle" type="text" required maxLength={160} />
        </div>

        <div className="field">
          <label htmlFor="s-pitch">The pitch</label>
          <textarea id="s-pitch" name="pitch" required minLength={80} maxLength={4000} />
          <p className="hint">
            Two or three paragraphs. What the piece argues, why now is a fair time to run it, and
            why you are the person to write it.
          </p>
        </div>

        <div className="field">
          <label htmlFor="s-links">Anything you have published</label>
          <textarea id="s-links" name="links" maxLength={1200} style={{ minHeight: '5rem' }} />
          <p className="hint">Links, one per line. If you have never been published, say so — it is not a barrier.</p>
        </div>

        {/* Honeypot. Positioned off-screen rather than display:none, because
            some bots skip fields that are hidden outright. */}
        <div className="hp" aria-hidden="true">
          <label htmlFor="s-company">Company</label>
          <input id="s-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} />}

        <button className="btn" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send the pitch'}
        </button>

        {state === 'error' && <p className="formnote err">{message}</p>}
      </form>
    </>
  )
}
