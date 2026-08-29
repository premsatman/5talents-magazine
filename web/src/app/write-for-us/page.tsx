import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { SubmissionForm } from '@/components/SubmissionForm'

export const metadata: Metadata = {
  title: 'Write for us',
  description:
    'Submission guidelines and pitch form for 5Talents Magazine. We commission from Bible college students, working writers and first-timers.',
  alternates: { canonical: '/write-for-us' },
}

export default function WriteForUsPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Write for us</h1>
          <p>
            We commission from Bible college and seminary students, working writers, and people who
            have never been published. Pitch below — you do not need an account.
          </p>
        </div>

        <div className="prose">
          <h2>What we are looking for</h2>
          <ul>
            <li>
              <strong>Faith</strong> — teaching, formation and apologetics written for readers in
              their twenties, not for a seminary common room.
            </li>
            <li>
              <strong>Culture</strong> — film, music, books and television, Christian and
              mainstream both.
            </li>
            <li>
              <strong>Work &amp; money</strong> — career, calling, family expectation, the first
              job, joint-family finances.
            </li>
            <li>
              <strong>Wellbeing</strong> — mental health, burnout, singleness, relationships.
            </li>
            <li>
              <strong>Campus</strong> — student essays, and theses turned into readable articles.
            </li>
            <li>
              <strong>Heritage</strong> — Indian and Global South church history, missions history,
              festivals, indigenous worship.
            </li>
          </ul>

          <h2>What we do not publish</h2>
          <p>
            No news, no current affairs, no political controversy, no persecution or caste
            reporting. That is a deliberate scope, explained on the{' '}
            <Link href="/about#scope">about page</Link>. A useful test: if the piece only makes
            sense this month, it is outside what we do.
          </p>

          <h2>How to pitch</h2>
          <ul>
            <li>Pitch the idea, not the finished piece. Two or three paragraphs is plenty.</li>
            <li>
              Tell us what the article <em>argues</em>, not just what it is about. &ldquo;An essay
              about burnout&rdquo; is a topic; &ldquo;burnout in ministry families is treated as a
              spiritual failure, and that framing is what keeps people from getting help&rdquo; is
              a piece.
            </li>
            <li>
              Write for a global reader. Explain Indian context rather than assuming it — a
              significant part of our readership is in the US, UK, Canada, Australia and the Gulf.
            </li>
            <li>Say roughly how long you think it should be. Most of what we run is 1,200–2,500 words.</li>
          </ul>

          <h2>Rates and rights</h2>
          <p>
            We are a small publication and we say so plainly: rates are modest and we discuss them
            per commission before you write anything. You keep copyright. We ask for first
            publication and the right to keep the piece in our archive.
          </p>

          <h2>What happens next</h2>
          <p>
            Everything is read. We reply to what we can commission, usually within two weeks. A
            silence past that means it was not right for us this time, and you are welcome to pitch
            again.
          </p>
        </div>

        <div style={{ marginTop: 'var(--s-7)' }}>
          <h2 className="brush-rule" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Send a pitch
          </h2>
          <SubmissionForm />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
