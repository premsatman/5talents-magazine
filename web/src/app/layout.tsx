import type { Metadata } from 'next'
import {
  Anton,
  Archivo,
  Fraunces,
  Newsreader,
} from 'next/font/google'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { Analytics } from '@/components/Analytics'
import { MetaPixel } from '@/components/MetaPixel'
import { FloatingReel } from '@/components/FloatingReel'
import { SanityLive } from '@/sanity/live'
import { defaultDescription, siteName, siteUrl, tagline } from '@/lib/site'
import './globals.css'

/**
 * Type.
 *
 * Two roles, deliberately separated:
 *
 *   --font-wordmark   Anton, always. It is the closest living relative to the
 *                     masthead that ran across all eighteen early issues, and it
 *                     is the one piece of the identity worth keeping fixed
 *                     while the rest is still moving.
 *
 *   --font-display    Headlines. Switchable, because Anton at 5.5rem is a
 *                     brick - condensed, uniformly heavy, and it flattens a
 *                     long headline into a wall.
 *
 * Fraunces was chosen (NEXT_PUBLIC_DISPLAY_FONT="fraunces"). Instrument Serif
 * and Bricolage Grotesque were removed on 21 Oct 2026: next/font ships and
 * preloads every face imported here, used or not, and the two spare families
 * were render-blocking weight on every page for no visible effect. To try one
 * again, re-import it and add it back to DISPLAY_FONTS and the class list.
 */
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' })

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
})

/**
 * Fontshare faces — Gambarino, Boska and the rest — are free for commercial use
 * under the ITF Free Font License but are not on Google Fonts, so they need the
 * file. Download it, drop the .woff2 into src/fonts/, then uncomment this and
 * add `gambarino: '--font-gambarino'` to DISPLAY_FONTS below.
 *
 * See src/fonts/README.md for the full note, including why the free Casta is
 * not usable here.
 *
 * import localFont from 'next/font/local'
 *
 * const gambarino = localFont({
 *   src: '../fonts/Gambarino-Regular.woff2',
 *   variable: '--font-gambarino',
 *   display: 'swap',
 * })
 */

const DISPLAY_FONTS = {
  anton: '--font-anton',
  fraunces: '--font-fraunces',
} as const

const choice = (process.env.NEXT_PUBLIC_DISPLAY_FONT ??
  'fraunces') as keyof typeof DISPLAY_FONTS
const displayVar = DISPLAY_FONTS[choice] ?? DISPLAY_FONTS.fraunces

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

  return (
    // suppressHydrationWarning is correct here and only here: the inline script
    // below sets data-theme on this element before React hydrates, so the
    // server HTML and the client tree differ by design. Without it React logs a
    // hydration mismatch on every page load.
    <html
      lang="en"
      data-display={choice}
      className={[
        anton.variable,
        archivo.variable,
        newsreader.variable,
        fraunces.variable,
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
