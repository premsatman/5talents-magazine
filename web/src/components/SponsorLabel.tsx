import Link from 'next/link'
import { clean } from '@/sanity/stega'

/**
 * The disclosure label.
 *
 * Design system s5: this is a component, not a habit. It is driven entirely by
 * the sponsorTier field so it renders automatically and can never be forgotten.
 * Manual labelling fails eventually, and the failure is a compliance problem,
 * not a design one.
 *
 * It sits ABOVE the headline, before any content, at 17px, ink on paper.
 */
const COPY = {
  sponsored: {
    label: 'Sponsored',
    note: 'This article was paid for by a sponsor. It was written by the 5Talents editorial team, who retained control of its content.',
  },
  supplied: {
    label: 'Paid feature',
    note: 'This article was written and supplied by the advertiser. It was not produced by the 5Talents editorial team.',
  },
} as const

export function isSponsored(tier: unknown): boolean {
  const value = clean(tier)
  return typeof value === 'string' && value !== '' && value !== 'none'
}

export function SponsorLabel({
  tier,
  sponsor,
  showNote = false,
}: {
  tier?: unknown
  sponsor?: { name?: string | null } | null
  showNote?: boolean
}) {
  // clean() before the lookup - a branded key misses the table entirely.
  const key = clean(tier)
  if (!key || key === 'none') return null
  const copy = COPY[key as keyof typeof COPY]
  if (!copy) return null

  return (
    <>
      <span className="splabel">
        {copy.label}
        {sponsor?.name ? ` · ${sponsor.name}` : ''}
      </span>
      {showNote && (
        <p className="splabel-note">
          {copy.note} <Link href="/about#advertising">How we handle advertising</Link>
        </p>
      )}
    </>
  )
}
