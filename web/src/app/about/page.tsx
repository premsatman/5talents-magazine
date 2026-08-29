import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { ABOUT_QUERY } from '@/sanity/queries'
import { scopeStatement as fallbackScope, tagline } from '@/lib/site'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Prose } from '@/components/PortableBody'

export const metadata: Metadata = {
  title: 'About',
  description:
    '5Talents is a magazine for young Christians, edited from India, written for the world. Published since 2012.',
  alternates: { canonical: '/about' },
}

export default async function AboutPage() {
  const { data } = await sanityFetch({ query: ABOUT_QUERY })
  const scope = data?.scopeStatement ?? fallbackScope

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>About 5Talents</h1>
          <p>{tagline}</p>
        </div>

        <div className="prose">
          <p>
            5Talents is a magazine for young Christians, edited from India and written for the
            world. It began in Hyderabad in July 2012, ran for seventeen printed issues, and
            returns now as a website — which, looking back at that first cover with its fake
            browser navigation printed across the top, is probably what it always wanted to be.
          </p>

          <p>
            The name comes from Matthew 25:14–30. The parable is not about visibility. The servants
            are not commended for the size of the crowd; they are commended for use.
          </p>

          {data?.mission && <p>{data.mission}</p>}

          {/* Blueprint s4 and s8: the published scope statement. This is what
              keeps the magazine outside the "news and current affairs" category
              that triggers the IT Rules 2021 obligations, and it is the evidence
              of scope if anyone ever asks. */}
          <h2 id="scope">What we cover, and what we do not</h2>
          <p>
            <strong>{scope}</strong>
          </p>
          <p>
            We publish culture, formation, work and money, wellbeing, campus writing, and the
            history of the church in India and the Global South. We do not report news, cover
            persecution or caste, or comment on political controversy. If a piece only makes sense
            this month, it is outside what we do.
          </p>

          <h2 id="advertising">Advertising and disclosure</h2>
          <p>
            Some articles are paid for. Every one of them carries a label above the headline,
            before any content, and that label is generated automatically from the article&rsquo;s
            record rather than added by hand — so it cannot be forgotten.
          </p>
          <ul>
            <li>
              <strong>Sponsored</strong> means a sponsor paid for the piece and our editorial team
              wrote it, keeping control of what it says.
            </li>
            <li>
              <strong>Paid feature</strong> means the advertiser wrote and supplied it. We did not.
            </li>
          </ul>
          <p>
            Advertisers do not see articles before publication, do not influence coverage of
            anything they are not paying for, and cannot buy their way out of a review.{' '}
            <Link href="/advertise">Rates and formats</Link>.
          </p>

          {data?.doctrinalStatement && (
            <>
              <h2 id="beliefs">What we believe</h2>
              <Prose value={data.doctrinalStatement} />
            </>
          )}

          {(data?.masthead ?? []).length > 0 && (
            <>
              <h2 id="masthead">Masthead</h2>
              <ul>
                {(data?.masthead ?? []).map((entry, index) => (
                  <li key={entry?.person?.slug ?? index}>
                    <strong>{entry?.role}</strong> —{' '}
                    {entry?.person?.slug ? (
                      <Link href={`/authors/${entry.person.slug}`}>{entry.person.name}</Link>
                    ) : (
                      entry?.person?.name
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 id="contact">Getting in touch</h2>
          <p>
            Pitches go through <Link href="/write-for-us">Write for us</Link>. Corrections go to{' '}
            <Link href="/corrections">our corrections page</Link>. Everything else:{' '}
            <Link href="/contact">contact us</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
