'use client'

import type { ReactNode } from 'react'
import { outboundClick } from '@/lib/analytics'

/**
 * An external link that records the click in GA4 before the reader leaves.
 *
 * This is our side of the ledger: "we sent you N readers" does not depend on
 * the organisation having analytics, or sharing it.
 */
export function OutboundLink({
  href,
  placement,
  kind,
  slug,
  rel = 'noopener noreferrer',
  className,
  children,
}: {
  href: string
  /** Where on the page: 'find-them', 'sources', 'body'. */
  placement: string
  /** What it points at: 'website', 'tickets', 'instagram', 'source' and so on. */
  kind: string
  /** Defaults to the last segment of the page the reader is on. */
  slug?: string
  rel?: string
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={rel}
      className={className}
      onClick={() =>
        outboundClick({
          placement,
          kind,
          slug: slug ?? window.location.pathname.split('/').filter(Boolean).pop() ?? '',
          url: href,
        })
      }
    >
      {children}
    </a>
  )
}
