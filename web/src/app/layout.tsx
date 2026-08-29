import type { Metadata } from 'next'
import {
  Anton,
  Archivo,
  Bricolage_Grotesque,
  Fraunces,
  Instrument_Serif,
  Newsreader,
} from 'next/font/google'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { SanityLive } from '@/sanity/live'
import { defaultDescription, siteName, siteUrl, tagline } from '@/lib/site'
import './globals.css'

/**
 * Type.
 *
 * Two roles, deliberately separated:
 *
 *   --font-wordmark   Anton, always. It is the closest living relative to the
 *                     printed masthead that ran across eighteen issues, and it
 *                     is the one piece of the identity worth keeping fixed
 *                     while the rest is still moving.
 *
 *   --font-display    Headlines. Switchable, because Anton at 5.5rem is a
 *                     brick - condensed, uniformly heavy, and it flattens a
 *                     long headline into a wall.
 *
 * Set NEXT_PUBLIC_DISPLAY_FONT in .env.local and reload. Once you have chosen,
 * delete the other three imports below - next/font ships each face you load.
 */
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' })

const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', display: 'swap' })

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
})

// High-contrast display serif. The closest freely licensed relative of Casta,
// and the one that most resembles what you were looking at.
const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument',
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

// If you would rather stay with a sans: characterful, editorial, and nothing
// like the uniform weight of Anton.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
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
  'instrument-serif': '--font-instrument',
  fraunces: '--font-fraunces',
  bricolage: '--font-bricolage',
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
  openGraph: {
    type: 'website',
    siteName,
    locale: 'en_IN',
  },
  robots: { index: true, follow: true },
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
        instrumentSerif.variable,
        fraunces.variable,
        bricolage.variable,
      ].join(' ')}
      style={{ ['--font-display-active' as string]: `var(${displayVar})` }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <SanityLive />
        {isDraft && <VisualEditing />}
      </body>
    </html>
  )
}
