import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Plagiarism policy',
  description:
    'How 5Talents Magazine checks submitted and republished work for plagiarism, and what happens when something is found.',
  alternates: { canonical: '/plagiarism' },
}

/**
 * Plagiarism policy.
 *
 * Section 12 of the ISSN India detailed information document says UGC
 * guidelines are to be followed for checking plagiarism, and the guidelines
 * reserve the right to decline an ISSN where an article is plagiarised or
 * reproduced from another publication. Publishing the policy is the visible
 * half; the archive triage is the half that does the work.
 *
 * Written in the first person and about what actually happens, rather than as
 * a compliance notice. A policy nobody follows is worse than no policy, and an
 * assessor reading this alongside the corrections page can tell the difference.
 */
export default function PlagiarismPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Plagiarism policy</h1>
          <p>What we check, and what happens when we find something.</p>
        </div>

        <div className="prose">
          <p>
            Everything 5Talents publishes must be the work of the person whose name is on it.
            That applies to commissioned pieces, to unsolicited submissions, and to writing
            republished from our own 2012&ndash;2014 archive.
          </p>

          <h2 id="standard">The standard</h2>
          <p>
            We follow the University Grants Commission&rsquo;s guidelines on plagiarism. In
            practice that means: quoted material is marked as a quotation and attributed; ideas
            and findings taken from someone else are cited even when the words are our own;
            translated passages are treated as quotations, not as original writing; and
            self-plagiarism &mdash; republishing your own work as new &mdash; is disclosed rather
            than hidden.
          </p>
          <p>
            Similarity to an existing source is not by itself misconduct. A common phrase, a
            standard definition, or a Scripture reference will match, and should. What we act on
            is unattributed substance: passages, structure or argument taken from a source the
            reader is not told about.
          </p>

          <h2 id="checking">How we check</h2>
          <ul>
            <li>
              Every submission is checked before publication, and anything quoting or closely
              following a source is traced back to that source.
            </li>
            <li>
              Anything drawn on for a piece is named in it. Where a writer builds on published
              research, the research is cited.
            </li>
            <li>
              Archive pieces get the same treatment before they are republished, and the
              republished version carries a note explaining what was rewritten and why.
            </li>
            <li>
              Where a piece was supplied by an advertiser or a sponsor, that is disclosed above
              the headline &mdash; a label generated from the article&rsquo;s record rather than
              added by hand. See <Link href="/about#advertising">advertising and disclosure</Link>.
            </li>
          </ul>

          <h2 id="found">When we find something</h2>
          <p>
            A piece found to be plagiarised is withdrawn. We do not quietly delete it: the article
            page stays, marked as retracted, carrying an explanation of what was wrong with it.
            That record is public on our{' '}
            <Link href="/corrections">corrections page</Link>, because a magazine that removes its
            mistakes without trace is asking to be trusted on nothing but its own word.
          </p>
          <p>
            Where the piece came from an outside contributor, we tell them what we found and why
            it was withdrawn, and we do not commission from them again.
          </p>

          <h2 id="reporting">Telling us about something</h2>
          <p>
            If you think we have published something that is not original, write to us through the{' '}
            <Link href="/contact">contact page</Link> with the piece and the source you believe it
            came from. We will check it and reply, and if you are right we will say so in public.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
