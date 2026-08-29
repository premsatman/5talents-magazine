import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { SITE_SETTINGS_QUERY } from '@/sanity/queries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Advertise',
  description:
    'Advertising, sponsorship and paid features in 5Talents Magazine — formats, placements and how our editorial firewall works.',
  alternates: { canonical: '/advertise' },
}

/**
 * Rate card.
 *
 * Prices are deliberately absent: blueprint s5 says decide payment terms before
 * quoting anyone. Fill the Rate column in once you have. Slots D, F and G are
 * the direct-sold inventory and are live from launch.
 */
const SLOTS = [
  { slot: 'D', where: 'Sidebar, article pages', size: '300 × 250', note: 'Sticky, desktop only. Sits beside the reading column.' },
  { slot: 'F', where: 'Homepage, between sections', size: '728 × 90 or 300 × 250', note: 'The most visible direct-sold placement.' },
  { slot: 'G', where: 'Newsletter, inline', size: '600 × 150', note: 'One placement per issue. Saturday send.' },
  { slot: '—', where: 'Sponsored article', size: 'Full page', note: 'We write it. Labelled above the headline.' },
  { slot: '—', where: 'Paid feature', size: 'Full page', note: 'You write it. Labelled above the headline.' },
]

export default async function AdvertisePage() {
  const { data } = await sanityFetch({ query: SITE_SETTINGS_QUERY })

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Advertise</h1>
          <p>
            5Talents reaches Christian readers in their twenties and thirties — in India and across
            the diaspora in the US, UK, Canada, Australia and the Gulf.
          </p>
        </div>

        <div className="prose">
          <h2>Who reads us</h2>
          <p>
            The magazine has published since 2012 and returns in 2026 with an archive of seventeen
            issues behind it. Our readers are students, early-career professionals, ministry
            workers and people working out what to do with a gift. If you are selling to an older,
            institutional Christian audience, we are probably not your best buy — and we would
            rather tell you that now.
          </p>
          <p>
            Current audience figures are shared with enquiries rather than published, because a new
            site&rsquo;s numbers move quickly and a stale page helps nobody.
          </p>

          <h2>Placements</h2>
        </div>

        <div className="table-scroll">
          <table className="ratecard">
            <thead>
              <tr>
                <th scope="col">Slot</th>
                <th scope="col">Where</th>
                <th scope="col">Size</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((row, index) => (
                <tr key={index}>
                  <td>{row.slot}</td>
                  <td>{row.where}</td>
                  <td>{row.size}</td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="prose" style={{ marginTop: 'var(--s-6)' }}>
          <h2>The editorial firewall</h2>
          <p>This is the part worth reading before you enquire.</p>
          <ul>
            <li>
              Every paid placement is labelled above the headline, before any content. The label is
              generated from the article record automatically — nobody has to remember to add it,
              and nobody can remove it.
            </li>
            <li>
              <strong>Sponsored</strong> means we wrote it and kept control of what it says.{' '}
              <strong>Paid feature</strong> means you wrote it and we ran it as supplied.
            </li>
            <li>Advertisers do not see unrelated articles before publication.</li>
            <li>
              Buying a placement does not buy coverage, does not buy a review, and does not buy a
              say in one you did not like.
            </li>
            <li>
              We decline advertising we would not want to explain to a reader — and we would rather
              lose the booking than the trust.
            </li>
          </ul>

          <h2>Enquiries</h2>
          <p>
            Email{' '}
            {data?.contactEmail ? (
              <a href={`mailto:${data.contactEmail}?subject=Advertising%20enquiry`}>
                {data.contactEmail}
              </a>
            ) : (
              <Link href="/contact">us</Link>
            )}{' '}
            with what you are promoting, which placement interests you, and your timing. We will
            come back with availability, current audience figures and a quote.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
