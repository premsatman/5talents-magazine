import type { Metadata } from 'next'
import {
  Anton,
  Archivo,
  Bebas_Neue,
  Fraunces,
  Newsreader,
  Space_Grotesk,
} from 'next/font/google'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { Analytics } from '@/components/Analytics'
import { MetaPixel } from '@/components/MetaPixel'
import { FloatingReel } from '@/components/FloatingReel'
import { SanityLive, sanityFetch } from '@/sanity/live'
import { DISPLAY_FONT_QUERY } from '@/sanity/queries'
import { defaultDescription, siteName, siteUrl, tagline } from '@/lib/site'
import './globals.css'

/**
 * Type.
 *
 * Two roles, deliberately separated:
 *
 *   --font-wordmark   Bebas Neue - the face the logo is actually set in.
 *                     Anton stood in for it on the reasoning that it was the
 *                     closest living relative to the masthead that ran across
 *                     all eighteen early issues; the real thing turned out to
 *                     be available. Still the one piece of the identity kept
 *                     fixed while the rest of the type moves, with Anton left
 *                     behind it in the stack as the fallback it always was in
 *                     spirit.
 *
 *                     Google serves Bebas Neue for Latin. The Cyrillic release
 *                     is a separate file with the same Latin letterforms - if
 *                     the wordmark ever needs Cyrillic glyphs, that one has to
 *                     be self-hosted, like Clash below.
 *
 *   --font-display    Headlines. Switchable, because Anton at 5.5rem is a
 *                     brick - condensed, uniformly heavy, and it flattens a
 *                     long headline into a wall.
 *
 * The face is now chosen in Sanity (Site settings -> Headline font) rather
 * than by NEXT_PUBLIC_DISPLAY_FONT, which stays as the fallback for local work
 * and for the moment before anyone has picked one.
 *
 * That has a cost worth stating plainly, because it partly undoes the 21 Oct
 * 2026 decision. Instrument Serif and Bricolage were removed that day on the
 * grounds that next/font ships and PRELOADS every face imported here, used or
 * not, so spare families were render-blocking weight on every page. A font
 * switchable from the dashboard has to be built, so every candidate must ship.
 *
 * The mitigation is `preload: false` on the display faces. Without a preload
 * link the browser fetches a family only when something on the page actually
 * renders in it - so the three it is not set to cost a few hundred bytes of
 * CSS each and nothing more. The price is paid by the one that IS set: its
 * file is discovered a beat later, so a headline can flash in the fallback
 * serif first. Body text is unaffected; Newsreader and Archivo still preload.
 *
 * If that flash ever looks worse than the convenience is worth, the way back
 * is to delete this field's use, pin the choice to the env var again, and set
 * preload: true on the one face that remains.
 */
const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
  // Also the wordmark, which is on every page - but the wordmark is small and
  // above the fold, so it is the one display face still worth preloading.
})

// The wordmark, on every page and above the fold, so this one preloads.
const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', display: 'swap' })

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
})

// Variable serif with optical-size, SOFT and WONK axes. Warmer and more
// particular than Instrument Serif, and much harder to mistake for another site.
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
  preload: false,
})

/**
 * Space Grotesk. A grotesque with the proportions slightly off on purpose -
 * the same family of idea as Clash, and the one of the two that Google serves,
 * so it needs no download and self-hosts like the rest.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: false,
})

/**
 * Clash Grotesk, from Fontshare. Free for commercial use under the ITF Free
 * Font Licence, but not on Google Fonts, so it needs the file.
 *
 * To switch it on, two edits and a download:
 *   1. Get the variable .woff2 from fontshare.com/fonts/clash-grotesk and put
 *      it in src/fonts/ClashGrotesk-Variable.woff2
 *   2. Uncomment the block below, add `'clash-grotesk': '--font-clash-grotesk'`
 *      to DISPLAY_FONTS, and add clashGrotesk.variable to the class list
 *
 * It is deliberately NOT listed as an option in Sanity until then. A dropdown
 * entry that silently falls through to Georgia is worse than one that is not
 * offered - see the note on republishConsent in issn/RIGHTS.md for what a
 * field nothing honours costs.
 *
 * import localFont from 'next/font/local'
 *
 * const clashGrotesk = localFont({
 *   src: '../fonts/ClashGrotesk-Variable.woff2',
 *   variable: '--font-clash-grotesk',
 *   display: 'swap',
 *   preload: false,
 * })
 */
const DISPLAY_FONTS = {
  anton: '--font-anton',
  fraunces: '--font-fraunces',
  'space-grotesk': '--font-space-grotesk',
} as const

type DisplayFont = keyof typeof DISPLAY_FONTS

const FALLBACK = (process.env.NEXT_PUBLIC_DISPLAY_FONT ?? 'fraunces') as DisplayFont

function resolveFont(chosen?: string | null): DisplayFont {
  const key = (chosen ?? '') as DisplayFont
  if (DISPLAY_FONTS[key]) return key
  return DISPLAY_FONTS[FALLBACK] ? FALLBACK : 'fraunces'
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — ${tagline}`,
    template: `%s — ${siteName}`,
  },
  description: defaultDescription,
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': `${siteUrl}/rss.xml` },
  },
  /* Pinterest domain claim. Claiming puts the magazine's name and logo on
     every Pin that links here, whoever pinned it, and is what the RSS
     auto-publish connection checks against. Site-wide because Pinterest
     verifies the homepage. */
  verification: {
    other: { 'p:domain_verify': '88eb99e7919bc43ec990d9dd5557e554' },
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/favicon/site.webmanifest',
  openGraph: {
    url: '/',
    type: 'website',
    siteName,
    locale: 'en_IN',
  },
  // max-image-preview:large lets Google show the lead image as a thumbnail in
  // results, and large in Discover. Without it Google may show no image at all.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

/**
 * Applies the stored theme before first paint. Without this the page renders in
 * the system theme and then snaps to the saved one - a visible flash.
 * Wrapped in try/catch because localStorage throws outright in some contexts.
 */
const themeScript = `try{var t=localStorage.getItem('5t-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled: isDraft } = await draftMode()

  // Cached and tag-revalidated like every other Sanity read, so this is not a
  // round trip per page. If it fails the fallback stands and the site renders.
  let chosen: string | null = null
  try {
    const { data } = await sanityFetch({ query: DISPLAY_FONT_QUERY, stega: false })
    chosen = (data ?? null) as string | null
  } catch {
    /* fall through to the env default */
  }
  const choice = resolveFont(chosen)
  const displayVar = DISPLAY_FONTS[choice]

  return (
    // suppressHydrationWarning is correct here and only here: the inline script
    // below sets data-theme on this element before React hydrates, so the
    // server HTML and the client tree differ by design. Without it React logs a
    // hydration mismatch on every page load.
    <html
      lang="en"
      data-display={choice}
      className={[
        bebas.variable,
        anton.variable,
        archivo.variable,
        newsreader.variable,
        fraunces.variable,
        spaceGrotesk.variable,
      ].join(' ')}
      style={{ ['--font-display-active' as string]: `var(${displayVar})` }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <FloatingReel />
        <SanityLive />
        {isDraft && <VisualEditing />}
        <Analytics />
        <MetaPixel />
      </body>
    </html>
  )
}
