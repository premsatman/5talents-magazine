import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { ABOUT_QUERY } from '@/sanity/queries'
import { scopeStatement as fallbackScope, tagline } from '@/lib/site'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Prose } from '@/components/PortableBody'
import { JournalParticulars } from '@/components/JournalParticulars'
import { publisherLines } from '@/lib/publisher'

export const metadata: Metadata = {
  title: 'About',
  description:
    '5Talents is a magazine for young Christians, edited from India, written for the world. Founded in Hyderabad in 2012, published as a website since 2026.',
  alternates: { canonical: '/about' },
}

export default async function AboutPage() {
  const { data } = await sanityFetch({ query: ABOUT_QUERY })
  const scope = data?.scopeStatement ?? fallbackScope
  const publisher = data?.publisher ?? null
  const address = publisherLines(publisher)

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
            world. It began in Hyderabad in July 2012 and ran to eighteen issues by July 2014 —
            made as PDFs and passed around a small circle of friends and supporters rather than
            published to anyone who wanted it. It became a magazine in the open sense in 2026,
            as a website, which — looking back at that first cover with its fake browser
            navigation drawn across the top — is probably what it always wanted to be.
          </p>
          <p>
            Those eighteen issues are <Link href="/archive">the archive</Link>. They are the
            magazine&rsquo;s origins rather than its back catalogue: they were never printed, never
            sold and never publicly circulated, and we do not count them as publication. 5Talents
            has been published, in the ordinary meaning of the word, since 2026.
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

          {/* ISSN India detailed information document, s6: the publication's
              opening pages must carry the particulars block - title, frequency,
              ISSN, publisher name and address, starting year, subject,
              language, format, email, mobile. The footer links straight to this
              anchor from every page. */}
          <h2 id="particulars">Journal particulars</h2>
          <JournalParticulars
            title={data?.title ?? '5Talents Magazine'}
            publisher={publisher}
            particulars={data?.particulars ?? null}
          />

          {publisher?.name && address.length > 0 && (
            <>
              <h2 id="publisher">Publisher</h2>
              <p>
                5Talents Magazine is published by <strong>{publisher.name}</strong>.
                <br />
                {address.map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
                {publisher.email && <a href={`mailto:${publisher.email}`}>{publisher.email}</a>}
              </p>
            </>
          )}

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

          <h2 id="board">Editorial board</h2>
          <p>
            The magazine&rsquo;s editorial board, with each member&rsquo;s institution and
            contact details, is listed on its{' '}
            <Link href="/editorial-board">own page</Link>.
          </p>

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
