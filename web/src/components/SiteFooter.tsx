import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { SITE_SETTINGS_QUERY } from '@/sanity/queries'
import { scopeStatement as fallbackScope, tagline } from '@/lib/site'
import { clean } from '@/sanity/stega'
import { NewsletterForm } from './NewsletterForm'
import { BrushStroke } from './Wordmark'

/**
 * Footer.
 *
 * The subscription form sits at the top of it, above the link columns, because
 * a reader who has scrolled the whole homepage is the one most likely to
 * subscribe - and blueprint section 6 makes email the highest-leverage channel
 * by a distance.
 */
/**
 * Studio credit lockup. White artwork on transparency, so it needs a dark
 * surface — the footer is fixed to --inverse-bg in both themes, which is the
 * only place it appears.
 *
 * Served as a plain <img>, not next/image. Next refuses remote SVG through the
 * optimizer unless `dangerouslyAllowSVG` is set, and turning that on would
 * loosen the rule for every remote image on the site to save nothing: an SVG
 * logotype is already a few hundred bytes and has no raster to resize. An SVG
 * referenced by <img src> cannot run script, so this is the safe half of what
 * that flag would enable.
 */
const TUNEDUP_LOCKUP =
  'https://res.cloudinary.com/dkaghqnvm/image/upload/v1788069486/TunedUp/logos/full-logo-white-logo_gdhy9d.svg'

export async function SiteFooter() {
  const { data: settings } = await sanityFetch({ query: SITE_SETTINGS_QUERY })
  const scope = settings?.scopeStatement ?? fallbackScope
  const socials = settings?.socials ?? []

  return (
    <footer className="site">
      <div className="footer-signup">
        <div className="wrap footer-signup__inner">
          <div>
            <h2>One good read, every Saturday</h2>
            <p>
              The cover story, two essays worth your time, and nothing else. No noise, no daily
              pings.
            </p>
          </div>
          <div className="footer-signup__form">
            <NewsletterForm compact />
            <p className="footer-signup__small">
              Free. Unsubscribe from any email and we delete your address.
            </p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <p className="footer-logo">5TALENTS</p>
            <BrushStroke className="footer-stroke" />
            <p className="footer-tagline">{tagline}</p>
          </div>

          <div className="cols">
            <div>
              <h4>Sections</h4>
              <ul>
                <li><Link href="/faith">Faith</Link></li>
                <li><Link href="/culture">Culture</Link></li>
                <li><Link href="/work-money">Work &amp; money</Link></li>
                <li><Link href="/wellbeing">Wellbeing</Link></li>
                <li><Link href="/campus">Campus</Link></li>
                <li><Link href="/heritage">Heritage</Link></li>
              </ul>
            </div>
            <div>
              <h4>Read</h4>
              <ul>
                <li><Link href="/interviews">Cover stories</Link></li>
                <li><Link href="/talent-search">Talent search</Link></li>
                <li><Link href="/archive">The archive</Link></li>
                <li><Link href="/rss.xml">RSS feed</Link></li>
              </ul>
            </div>
            <div>
              <h4>Get involved</h4>
              <ul>
                <li><Link href="/write-for-us">Write for us</Link></li>
                <li><Link href="/advertise">Advertise</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4>About</h4>
              <ul>
                <li><Link href="/about">Who we are</Link></li>
                <li><Link href="/about#scope">What we cover</Link></li>
                <li><Link href="/corrections">Corrections</Link></li>
                <li><Link href="/privacy">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {socials.length > 0 && (
          <p className="footer-socials">
            {socials.map((social, index) => (
              <span key={clean(social?.url) ?? index}>
                {index > 0 && <span aria-hidden="true"> · </span>}
                <a href={clean(social?.url) ?? '#'} rel="noopener noreferrer" target="_blank">
                  {social?.platform}
                </a>
              </span>
            ))}
          </p>
        )}

        {/* Blueprint sections 4 and 8: the published scope statement. */}
        <p className="scope">{scope}</p>

        <p className="footer-legal">
          © {new Date().getFullYear()} 5Talents Magazine. Published since 2012.
          <span aria-hidden="true"> · </span>
          {/* The lockup is white on transparency, so it only works against the
              dark footer — which is fixed to --inverse-bg in both themes. If
              this credit ever moves onto a light surface it needs the dark
              version of the mark, not a CSS filter. */}
          <span className="footer-credit">
            <span className="footer-credit__label">Handcrafted by</span>
            <a href="https://tunedup.one" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={TUNEDUP_LOCKUP} alt="Tunedup.one" height={15} loading="lazy" decoding="async" />
            </a>
          </span>
        </p>
      </div>
    </footer>
  )
}
