import { clean } from '@/sanity/stega'

/**
 * Magazine social links from Site settings.
 *
 * Platform is free text in Sanity ("Facebook", "Instagram"), so we match on
 * the name or the host. Unknown platforms fall back to the label as text —
 * better than inventing an icon for something we do not recognise.
 */

type Social = { platform?: string | null; url?: string | null }

const PATHS = {
  facebook:
    'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z',
  instagram:
    'M12 2.16c3.2 0 3.58.01 4.85.07 3.12.14 4.59 1.62 4.73 4.73.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.14 3.11-1.61 4.59-4.73 4.73-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.12-.14-4.59-1.62-4.73-4.73-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.56 3.85 4.03 2.37 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.36-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84ZM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4Zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44Z',
} as const

type Known = keyof typeof PATHS

const resolve = (platform: string | null | undefined, url: string | null | undefined): Known | null => {
  const name = (platform ?? '').toLowerCase().trim()
  const host = (() => {
    try {
      return url ? new URL(url).hostname.toLowerCase() : ''
    } catch {
      return ''
    }
  })()

  if (name.includes('facebook') || host.includes('facebook.com') || host.includes('fb.com')) {
    return 'facebook'
  }
  if (name.includes('instagram') || host.includes('instagram.com')) {
    return 'instagram'
  }
  return null
}

export function SocialLinks({
  socials,
  className = 'social-links',
}: {
  socials: (Social | null | undefined)[]
  className?: string
}) {
  const items = socials
    .map((social) => {
      const url = clean(social?.url)
      const platform = clean(social?.platform) ?? 'Social'
      if (!url) return null
      return { url, platform, icon: resolve(platform, url) }
    })
    .filter(Boolean) as { url: string; platform: string; icon: Known | null }[]

  if (items.length === 0) return null

  return (
    <ul className={className} aria-label="Social media">
      {items.map((item) => (
        <li key={item.url}>
          <a href={item.url} rel="noopener noreferrer" target="_blank" className="social-links__btn">
            {item.icon ? (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
                  <path d={PATHS[item.icon]} />
                </svg>
                <span className="visually-hidden">{item.platform}</span>
              </>
            ) : (
              item.platform
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
