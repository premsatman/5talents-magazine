import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { editorialEmail, pageOg } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms of use',
  description:
    'The terms on which 5Talents Magazine publishes: what you may do with our work, who owns what, and what sending us a submission means.',
  alternates: { canonical: '/terms' },
  openGraph: pageOg('/terms'),
}

/**
 * Terms of use.
 *
 * Written because three things on the site need one and had nowhere to point:
 * the submissions form, the advertise page, and Google's Reader Revenue
 * Manager, which asks for a Terms of Service URL beside the privacy policy.
 *
 * The copyright section is the part to be careful with. Contributors own their
 * articles - under the Copyright Act 1957 the author is first owner without a
 * written assignment, and none exist for the archive - while the magazine owns
 * the collective work: selection, arrangement, editing, headlines and in-house
 * writing. See issn/RIGHTS.md. This page must not claim more than that, and
 * must not assert permission the magazine does not hold.
 *
 * Voice follows /plagiarism and /corrections: what actually happens, in the
 * first person, rather than boilerplate nobody reads.
 */
export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Terms of use</h1>
          <p>What you may do with our work, who owns what, and what sending us something means.</p>
        </div>

        <div className="prose">
          <p>
            5Talents Magazine is published from Hyderabad, India. The publisher&rsquo;s name and
            full postal address are on the <Link href="/about#particulars">about page</Link>.
            Using this site means accepting what follows.
          </p>

          <h2 id="copyright">Who owns what</h2>
          <p>
            <strong>Articles belong to the people who wrote them.</strong> Every writer keeps the
            copyright in their own work, whether it was commissioned, sent to us unsolicited, or
            first printed in the 2012&ndash;2017 issues. We do not ask writers to sign their
            copyright over, and we have not.
          </p>
          <p>
            What the magazine owns is the collective work: which pieces appear and in what order,
            the editing, the headlines and decks, the design, and anything written in-house. Our
            photographs and illustrations belong to whoever made them, credited where they run.
          </p>

          <h2 id="reuse">Using what we publish</h2>
          <p>
            Read it, link to it, and quote from it. A short quotation with the writer&rsquo;s name
            and a link back needs no permission from anyone, and we are glad of it.
          </p>
          <p>
            <strong>Republishing a whole article, or a substantial part of one, needs written
            permission first.</strong> Because the writer owns the piece, that permission is
            theirs to give, not ours. Write to{' '}
            <a href={`mailto:${editorialEmail}`}>{editorialEmail}</a> and we will put you in touch
            or pass the request on. Translation, reposting on another site, printing in a
            newsletter, and feeding our work to a service that republishes it all count as
            republishing.
          </p>
          <p>
            Our <Link href="/rss.xml">RSS feed</Link> carries full article text so that readers
            and aggregators can read it where they prefer. It is not a licence to republish.
          </p>

          <h2 id="submissions">Sending us your work</h2>
          <p>
            Anyone may send us a pitch or a piece through the{' '}
            <Link href="/write-for-us">Write for us</Link> page. You do not need an introduction,
            a degree, or a track record. <strong>What runs is decided by the editorial board</strong>
            &nbsp;&mdash; see who they are on the{' '}
            <Link href="/editorial-board">editorial board page</Link> &mdash; and their decision is
            final. We read everything, and we reply to what we can commission.
          </p>
          <p>When you send us work, you are telling us three things:</p>
          <ul>
            <li>It is yours, and it is not taken from somewhere else. See our{' '}
              <Link href="/plagiarism">plagiarism policy</Link>, which we apply to submissions as
              well as to the archive.
            </li>
            <li>
              You are happy for us to publish it on this site and to keep it here, and to edit it
              for length, accuracy and house style. You see the edited piece before it runs.
            </li>
            <li>
              Anything you quote, photograph or borrow from someone else, you have the right to
              let us publish.
            </li>
          </ul>
          <p>
            You keep the copyright. We charge nothing to publish you, and at present we do not pay
            contributors; where that changes, it will be agreed in writing before the piece runs.
          </p>

          <h2 id="advertising">Advertising</h2>
          <p>
            Paid placements are labelled above the headline, before any of the content, and the
            label is generated from the record rather than remembered by a person. What we sell and
            how the editorial firewall works is set out on the{' '}
            <Link href="/advertise">advertise page</Link>. Buying a placement does not buy
            coverage, a review, or a say in one you did not like.
          </p>

          <h2 id="accuracy">Accuracy, and other people&rsquo;s sites</h2>
          <p>
            We try to get it right, and we fix it in the open when we do not &mdash; see{' '}
            <Link href="/corrections">corrections</Link>. Nothing here is legal, financial,
            medical or pastoral advice.
          </p>
          <p>
            We link to other people&rsquo;s sites and embed their posts and videos where it serves
            the story. We do not control what they publish and are not responsible for it, and an
            embed is not an endorsement.
          </p>

          <h2 id="complaints">Complaints</h2>
          <p>
            If something we have published wrongs you &mdash; a factual error, your work used
            without permission, a photograph you did not consent to &mdash; write to{' '}
            <a href={`mailto:${editorialEmail}`}>{editorialEmail}</a> with the article and what is
            wrong with it. We answer, in writing, and we say what we are doing about it. How we
            handle your data is on the <Link href="/privacy">privacy page</Link>.
          </p>

          <h2 id="changes">Changes</h2>
          <p>
            We update this page when what we do changes, and the change applies from the day it
            appears. Indian law governs it, and the courts at Hyderabad have jurisdiction.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
