import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { EDITORIAL_BOARD_QUERY } from '@/sanity/queries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { imprint } from '@/lib/publisher'

export const metadata: Metadata = {
  title: 'Editorial board',
  description:
    'The editorial board of 5Talents Magazine, with each member’s designation, institution and contact details.',
  alternates: { canonical: '/editorial-board' },
}

/**
 * The editorial board page.
 *
 * Built to section 3 of the ISSN India detailed information document, which is
 * unusually prescriptive: the board needs its own page on the magazine's own
 * site, a minimum of five members, the roles named (Patron, Editor-in-Chief,
 * Editor, Managing Editor), and for every member a full name, a designation, a
 * complete affiliated institutional address and an institutional email — not a
 * personal one.
 *
 * The institutional email is printed in full rather than hidden behind a
 * mailto or an obfuscator. That is the opposite of the usual advice about
 * harvesting, and it is deliberate: the address being visible and reachable is
 * the requirement, and during assessment the ISSN office writes to three of
 * these people at random and declines the whole application if they do not
 * answer inside three days.
 */
export default async function EditorialBoardPage() {
  const { data } = await sanityFetch({ query: EDITORIAL_BOARD_QUERY })
  const board = (data?.editorialBoard ?? []).filter((entry) => entry?.person?.name)
  const publisherLine = imprint(data?.publisher ?? null)

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Editorial board</h1>
          <p>Who decides what 5Talents publishes, and where they can be reached.</p>
        </div>

        {board.length === 0 ? (
          <div className="prose">
            <p>
              The board is being appointed. It will be listed here in full, with each
              member&rsquo;s designation, institution and institutional email address.
            </p>
          </div>
        ) : (
          <ol className="board">
            {board.map((entry, index) => {
              const person = entry?.person
              return (
                <li className="board__member" key={entry?._key ?? index}>
                  <p className="board__role">{entry?.role}</p>
                  <h2 className="board__name">
                    {person?.slug ? (
                      <Link href={`/authors/${person.slug}`}>{person.name}</Link>
                    ) : (
                      person?.name
                    )}
                  </h2>
                  {person?.designation && <p className="board__designation">{person.designation}</p>}
                  {person?.institution && <p className="board__institution">{person.institution}</p>}
                  {person?.institutionAddress && (
                    <p className="board__address">{person.institutionAddress}</p>
                  )}
                  <p className="board__contact">
                    {person?.institutionalEmail && (
                      <a href={`mailto:${person.institutionalEmail}`}>{person.institutionalEmail}</a>
                    )}
                    {person?.institutionalEmail && person?.profileUrl && (
                      <span aria-hidden="true"> · </span>
                    )}
                    {person?.profileUrl && (
                      <a href={person.profileUrl} rel="noopener noreferrer" target="_blank">
                        Institutional profile
                      </a>
                    )}
                  </p>
                </li>
              )
            })}
          </ol>
        )}

        <div className="prose board__foot">
          <h2>How the board works</h2>
          <p>
            The board sets editorial direction and reviews what the magazine publishes against its{' '}
            <Link href="/about#scope">stated scope</Link>. It does not review individual pieces
            before publication; that is the editor&rsquo;s job, and the{' '}
            <Link href="/corrections">corrections page</Link> is where mistakes are recorded
            afterwards.
          </p>
          <p>
            Board members are not paid, do not commission their own work into the magazine, and
            have no say over advertising. Where a member has any connection to the subject of a
            piece, that connection is disclosed on the piece.
          </p>
          {publisherLine && <p className="board__imprint">{publisherLine}</p>}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
