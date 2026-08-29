import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { POLICY_QUERY } from '@/sanity/queries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Prose } from '@/components/PortableBody'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What data 5Talents Magazine collects, why, and what you can ask us to do with it.',
  alternates: { canonical: '/privacy' },
}

export default async function PrivacyPage() {
  const { data } = await sanityFetch({ query: POLICY_QUERY })

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Privacy</h1>
          <p>What we collect, why, and how to get it removed.</p>
        </div>

        {data?.privacyPolicy ? (
          <Prose value={data.privacyPolicy} />
        ) : (
          <div className="prose">
            {/* PLACEHOLDER. Blueprint s8 and s9 budget a legal consultation -
                this is the one line not to cut. Replace this text with a policy
                reviewed against India's DPDP Act, and against GDPR if you are
                courting UK and EU diaspora readers, which section 3 says you are. */}
            <p>
              <strong>This is placeholder text.</strong> It describes what the site actually does,
              but it has not been reviewed by a lawyer. Replace it before launch with a policy
              checked against India&rsquo;s Digital Personal Data Protection Act — and against UK
              and EU rules if you are courting diaspora readers there.
            </p>
            <h2>What we collect</h2>
            <ul>
              <li>
                <strong>Newsletter subscribers.</strong> Your email address, and whether you opened
                or clicked an email. Held by our email provider. Unsubscribe from any email and it
                is deleted.
              </li>
              <li>
                <strong>Pitches.</strong> Whatever you type into the Write for us form, including
                your name and email, so we can reply.
              </li>
              <li>
                <strong>Analytics.</strong> Aggregate page views and traffic sources through Google
                Analytics. We do not sell this, and we do not build profiles of individual readers.
              </li>
              <li>
                <strong>Advertising.</strong> Where third-party ads appear, the ad network sets its
                own cookies under its own policy.
              </li>
            </ul>
            <h2>What we do not do</h2>
            <p>
              We do not sell your data, we do not share your email address with advertisers, and we
              do not email you anything you did not ask for.
            </p>
            <h2>Getting your data removed</h2>
            <p>
              Write to us at{' '}
              {data?.contactEmail ? (
                <a href={`mailto:${data.contactEmail}`}>{data.contactEmail}</a>
              ) : (
                <Link href="/contact">our contact address</Link>
              )}{' '}
              and we will delete what we hold.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
