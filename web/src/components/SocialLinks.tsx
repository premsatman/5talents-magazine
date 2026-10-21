import { clean } from '@/sanity/stega'

/**
 * Magazine social links from Site settings.
 *
 * Platform is free text in Sanity ("Facebook", "Instagram"), so we match on
 * the name or the host.
 *
 * Unknown platforms get a monogram - the initial in a ring - not an invented
 * icon and not the bare label, which overflowed the 40px button. To give one a
 * real icon, take the official SVG from that company's own brand or press kit,
 * copy its path data into PATHS, and add a match in resolve(). Do not redraw a
 * logo from memory or trace it by eye: a mark that is almost right is worse
 * than a monogram, and these are trademarks whose owners publish the correct
 * file precisely so nobody has to guess.
 *
 * The path must be a single path on a 24x24 viewBox, filled with currentColor,
 * so it inherits the footer's colour and the hover state like the others. If
 * the official file is multi-path or multi-colour, keep its monochrome variant.
 */

type Social = { platform?: string | null; url?: string | null }

const PATHS = {
  facebook:
    'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z',
  instagram:
    'M12 2.16c3.2 0 3.58.01 4.85.07 3.12.14 4.59 1.62 4.73 4.73.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.14 3.11-1.61 4.59-4.73 4.73-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.12-.14-4.59-1.62-4.73-4.73-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.56 3.85 4.03 2.37 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.36-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84ZM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4Zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44Z',
  bluesky:
    'M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z',
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
  if (name.includes('bluesky') || host === 'bsky.app' || host.endsWith('.bsky.app')) {
    return 'bluesky'
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
              <>
                <span className="social-links__mono" aria-hidden="true">
                  {item.platform.trim().charAt(0).toUpperCase()}
                </span>
                <span className="visually-hidden">{item.platform}</span>
              </>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
