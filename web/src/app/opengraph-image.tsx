import { ImageResponse } from 'next/og'
import { siteName, tagline } from '@/lib/site'

/**
 * Default share card.
 *
 * Next uses this for every route that does not export its own image, so one
 * file covers the homepage, /about, /archive, /write-for-us, /advertise and
 * each section, tag and author page. Articles override it with their own
 * photograph in [section]/[slug]/page.tsx.
 *
 * Drawn rather than uploaded: a static asset would have to be re-exported
 * every time the wordmark or the tagline changed, and the tagline has already
 * been corrected once (God's, not GODS').
 */

export const alt = `${siteName} — ${tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK = '#14130E'
const PAPER = '#FDFCF7'
const HIGHLIGHT = '#FDEF0A'

/**
 * Satori cannot read woff2, and fonts.googleapis.com only serves ttf to an
 * older User-Agent. If anything here fails the card still renders in the
 * default sans - a slightly off wordmark beats a broken build.
 */
async function antonFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Anton', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1)' },
      next: { revalidate: 86400 },
    }).then((r) => r.text())

    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1]
    if (!url) return null

    const res = await fetch(url)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

export default async function Image() {
  const anton = await antonFont()
  const display = anton ? 'Anton' : 'sans-serif'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: INK,
          color: PAPER,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 90px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: display,
              fontSize: 172,
              lineHeight: 1,
              letterSpacing: -4,
              display: 'flex',
            }}
          >
            5TALENTS
          </div>

          {/* The brush stroke, as a plain block. Satori's transform support is
              patchy, so this is a rectangle rather than the skewed sweep used
              on the site itself. */}
          <div
            style={{
              width: 560,
              height: 26,
              background: HIGHLIGHT,
              marginTop: 18,
              display: 'flex',
            }}
          />

          <div
            style={{
              marginTop: 42,
              fontSize: 34,
              color: '#C3BFB2',
              display: 'flex',
            }}
          >
            {tagline}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 56,
            left: 90,
            right: 90,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 24,
            letterSpacing: 3,
            color: '#8A857A',
          }}
        >
          <div style={{ display: 'flex' }}>EDITED FROM INDIA</div>
          <div style={{ display: 'flex' }}>PUBLISHED SINCE 2012</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: anton
        ? [{ name: 'Anton', data: anton, style: 'normal', weight: 400 }]
        : undefined,
    },
  )
}
