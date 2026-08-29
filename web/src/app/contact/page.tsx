import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { SITE_SETTINGS_QUERY } from '@/sanity/queries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach 5Talents Magazine.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const { data } = await sanityFetch({ query: SITE_SETTINGS_QUERY })

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Contact</h1>
          <p>Four ways in, depending on what you want.</p>
        </div>

        <div className="prose">
          <h2>Pitching an article</h2>
          <p>
            Use the <Link href="/write-for-us">Write for us</Link> form. It goes straight to the
            editor&rsquo;s queue, and you do not need an account.
          </p>

          <h2>Advertising or sponsorship</h2>
          <p>
            Rates, formats and the enquiry form are on the{' '}
            <Link href="/advertise">advertise page</Link>.
          </p>

          <h2>A correction</h2>
          <p>
            See <Link href="/corrections">corrections</Link>.
          </p>

          <h2>Anything else</h2>
          {data?.contactEmail ? (
            <p>
              <a href={`mailto:${data.contactEmail}`}>{data.contactEmail}</a>
            </p>
          ) : (
            <p>Add a contact address in Site settings in the Studio.</p>
          )}

          {(data?.socials ?? []).length > 0 && (
            <p>
              {(data?.socials ?? []).map((social, index) => (
                <span key={social?.url ?? index}>
                  {index > 0 && ' · '}
                  <a href={social?.url ?? '#'} rel="noopener noreferrer" target="_blank">
                    {social?.platform}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
