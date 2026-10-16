'use client'

import { track } from '@/lib/analytics'

/**
 * The yellow Subscribe button in the utility bar.
 *
 * It used to be a plain link to #newsletter, but only the homepage and article
 * pages render that block, so on every other page the button did nothing.
 * Every page does have the footer sign-up, so this goes to the main block when
 * there is one and to the footer when there is not, then puts the cursor in
 * the email field so the reader can just type.
 *
 * The href stays as a fallback for the moment before hydration.
 */
export function SubscribeButton() {
  return (
    <a
      className="subscribebtn"
      href="#newsletter"
      onClick={(e) => {
        const input =
          (document.getElementById('nl-email') as HTMLInputElement | null) ??
          (document.getElementById('nl-email-compact') as HTMLInputElement | null)
        track('subscribe_click', { placement: 'utility_bar', target: input?.id === 'nl-email' ? 'newsletter' : 'footer' })
        if (!input) return
        e.preventDefault()
        const block = input.closest('section, footer, .footer-signup') ?? input
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        // Centred, so the sticky nav never sits on top of the form.
        block.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
        input.focus({ preventScroll: true })
      }}
    >
      Subscribe
    </a>
  )
}
