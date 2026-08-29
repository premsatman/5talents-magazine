'use client'

import { useState } from 'react'

/**
 * Blueprint s6 makes email the highest-leverage channel, and s5 sells inline
 * newsletter placements (slot G). Posts to /api/subscribe, which talks to Resend.
 *
 * Before building anything around this: test a broadcast to ~150 dummy addresses.
 * Resend's free tier caps at roughly 100 sends/day, and a single broadcast to a
 * real list may exceed it. See blueprint trigger 3.
 */
export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setState('sending')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: data.get('email'),
          company: data.get('company'), // honeypot
        }),
      })
      const body = (await res.json()) as { message?: string }
      if (!res.ok) throw new Error(body.message ?? 'Something went wrong.')
      setState('done')
      setMessage(body.message ?? 'You are on the list. Look for the first Saturday email.')
      form.reset()
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    }
  }

  if (state === 'done') {
    return <p className="nlnote">{message}</p>
  }

  return (
    <>
      <form className="nlform" onSubmit={onSubmit}>
        <label className="visually-hidden" htmlFor={compact ? 'nl-email-compact' : 'nl-email'}>
          Email address
        </label>
        <input
          id={compact ? 'nl-email-compact' : 'nl-email'}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          required
        />
        <div className="hp" aria-hidden="true">
          <label htmlFor={compact ? 'nl-company-compact' : 'nl-company'}>Company</label>
          <input
            id={compact ? 'nl-company-compact' : 'nl-company'}
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Adding you…' : 'Subscribe free'}
        </button>
      </form>
      {state === 'error' && <p className="nlnote">{message}</p>}
    </>
  )
}
