'use client'

import Image from 'next/image'
import { playStoreClick } from '@/lib/analytics'

/**
 * Google's own "Get it on Google Play" badge (see EndCards.tsx for the brand
 * rules). A client component only so the click can be counted: GA4
 * `play_store_click` and Meta `AppClick`.
 */
const PLAY_BADGE = 'https://res.cloudinary.com/dkaghqnvm/image/upload/v1790656495/google-play-badge-en.png'

export function PlayBadge({ href, placement = 'endcard' }: { href: string; placement?: string }) {
  return (
    <a
      className="endcard-playbadge"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => playStoreClick(placement, href)}
    >
      <Image src={PLAY_BADGE} alt="Get it on Google Play" width={646} height={250} unoptimized />
    </a>
  )
}
