import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { POLICY_QUERY } from '@/sanity/queries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Prose } from '@/components/PortableBody'

export const metadata: Metadata = {
  title: 'Corrections',
  description: 'How 5Talents Magazine handles errors, and how to report one.',
  alternates: { canonical: '/corrections' },
}

export default async function CorrectionsPage() {
  const { data } = await sanityFetch({ query: POLICY_QUERY })

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Corrections</h1>
          <p>We would rather be corrected than be wrong quietly.</p>
        </div>

        {data?.correctionsPolicy ? (
          <Prose value={data.correctionsPolicy} />
        ) : (
          <div className="prose">
            <p>
              If you find an error in anything we have published — a fact, a name, a date, a
              misquotation — tell us and we will fix it.
            </p>
            <h2>How we handle it</h2>
            <ul>
              <li>
                Factual errors are corrected in the article itself, with a dated note at the foot
                explaining what changed.
              </li>
              <li>
                Typographical fixes that do not change meaning are made silently.
              </li>
              <li>
                If a piece is substantially wrong, we say so at the top, not the bottom.
              </li>
              <li>
                We do not quietly delete articles. If something has to come down, the page says why.
              </li>
            </ul>
            <h2>Interviews</h2>
            <p>
              Every interviewee gives written consent before publication and reviews their own
              quotes. If we have still got something wrong about you or your words, write to us and
              we will put it right.
            </p>
            <h2>Reporting an error</h2>
            <p>
              Email{' '}
              {data?.contactEmail ? (
                <a href={`mailto:${data.contactEmail}`}>{data.contactEmail}</a>
              ) : (
                <Link href="/contact">our contact page</Link>
              )}{' '}
              with the article title and what is wrong. Please include a source if you have one.
            </p>
            {data?.grievanceOfficer?.name && (
              <>
                <h2>Grievance officer</h2>
                <p>
                  {data.grievanceOfficer.name}
                  {data.grievanceOfficer.email ? ` — ${data.grievanceOfficer.email}` : ''}
                </p>
                {data.grievanceOfficer.address && <p>{data.grievanceOfficer.address}</p>}
              </>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
