import { ImageResponse } from 'next/og'
import { siteName, tagline } from '@/lib/site'
import { WORDMARK_PAPER_DATA_URI, WORDMARK_RATIO } from '@/lib/wordmark-art'

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

const WORDMARK_WIDTH = 720

export default async function Image() {
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
          {/* The real logotype, as outlines. Drawn text here used to be Anton
              pulled from fonts.googleapis.com on every render: the wrong face
              (the wordmark is Bebas Neue), and a network call that silently
              fell back to system sans whenever it failed. */}
          <img
            src={WORDMARK_PAPER_DATA_URI}
            width={WORDMARK_WIDTH}
            height={Math.round(WORDMARK_WIDTH / WORDMARK_RATIO)}
            alt=""
          />

          <div
            style={{
              marginTop: 36,
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
          <div style={{ display: 'flex' }}>FOUNDED 2012</div>
        </div>
      </div>
    ),
    size,
  )
}
