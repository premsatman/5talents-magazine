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
                courting UK and EU diaspora readers, which section 3 says you are.
                Updated 18 Sep 2026 to name Travelpayouts Drive, which rewrites
                outbound travel links and sets its own cookies on every page, and
                to disclose affiliate earnings. Anything added to the site that
                sets a cookie or calls a third party belongs in the list below on
                the day it ships, not afterwards. */}
            <p>
              <strong>This is placeholder text.</strong> It describes what the site actually does,
              accurately and as of the date below, but it has not been reviewed by a lawyer.
              Replace it with a policy checked against India&rsquo;s Digital Personal Data
              Protection Act — and against UK and EU rules, since we write for diaspora readers
              there.
            </p>
            <p>
              <em>Last updated 18 September 2026.</em>
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
                your name and email, so we can reply. The form is protected by Cloudflare Turnstile,
                which checks that you are not a bot.
              </li>
              <li>
                <strong>Analytics.</strong> Aggregate page views and traffic sources through Google
                Analytics. We do not sell this, and we do not build profiles of individual readers.
              </li>
              <li>
                <strong>Server logs.</strong> Our host keeps the ordinary record of requests — IP
                address, browser, page — for security and diagnostics.
              </li>
            </ul>

            <h2>Third parties that set cookies</h2>
            <p>
              Some of what runs on this site is not ours, and those services set their own cookies
              under their own policies. As of the date above, they are:
            </p>
            <ul>
              <li>
                <strong>Travelpayouts.</strong> A service called Drive runs on every page. It looks
                at links going out to travel companies and adds a code that tells them the visitor
                came from us. It sets cookies to do that, and it can see which pages you visit here.
              </li>
              <li>
                <strong>Google Analytics.</strong> Cookies that count visits and tell us how people
                arrived.
              </li>
              <li>
                <strong>Cloudflare Turnstile.</strong> On the Write for us form only, to stop
                automated submissions.
              </li>
              <li>
                <strong>Advertisers.</strong> Adverts we sell directly are plain images hosted by
                us, and set nothing. If we ever run an ad network, it will set its own cookies and
                will be named here before it does.
              </li>
            </ul>

            <h2>Affiliate links, and how we earn</h2>
            <p>
              Some links on this site earn us a small commission if you go on to book or buy
              something. It costs you nothing extra. This applies mainly to travel — flights,
              hotels, transfers and tours — and the link may have been added automatically by
              Travelpayouts rather than chosen by an editor.
            </p>
            <p>
              We say so on any article where it matters. What we will not do is let it decide what
              we cover or what we say about it. If we recommend something, it is because we think
              it is worth your time, and we would say the same if it paid us nothing.
            </p>

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
              and we will delete what we hold. You can ask us what we have about you, ask us to
              correct it, or ask us to delete it, and we will do it.
            </p>
            <p>
              If you would rather the third parties above did not set cookies, your browser can
              block them. Blocking them does not stop you reading anything here.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
