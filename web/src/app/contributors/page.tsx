import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { CONTRIBUTORS_QUERY } from '@/sanity/queries'
import { urlFor } from '@/sanity/image'
import { clean } from '@/sanity/stega'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Contributors',
  description:
    'Everyone who has written for 5Talents Magazine, in alphabetical order, with a link to each writer’s articles.',
  alternates: { canonical: '/contributors' },
}

/**
 * Typed by hand rather than from types.generated.ts. That file keys every
 * result type by the exact text of its query, so a new query has no type until
 * `npm run typegen` is run on the Mac - and this page should build either side
 * of that step.
 */
type Contributor = {
  _id: string
  name: string | null
  slug: string | null
  role: string | null
  country: string | null
  died: string | null
  photo: { asset?: { url?: string | null } | null } | null
  articleCount: number
}

/**
 * The name the alphabet sees.
 *
 * Titles are part of how a contributor is credited and stay on the page, but
 * they are not part of the name for filing: with them, every minister sorts
 * under R and every doctor under D, which is a list of titles, not of people.
 *
 * Sorted on the name as written, first name first. Surname order is the
 * library convention, but it needs to know which word is the surname, and for
 * a list this mixed - single names, joint bylines, initials - that is a guess
 * per person. As-written is what a reader scanning for someone already expects.
 */
const HONORIFIC = /^(?:(?:dr|rev|revd|pastor|ps|fr|sr|bro|bishop|prof|mr|mrs|ms)\.?\s+)+/i

function sortKey(name: string) {
  return name.trim().replace(HONORIFIC, '')
}

function initials(name: string) {
  return sortKey(name)
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default async function ContributorsPage() {
  const { data } = await sanityFetch({ query: CONTRIBUTORS_QUERY })

  const people = ((data ?? []) as unknown as Contributor[])
    .filter((person) => person.name && person.slug)
    .map((person) => ({ ...person, key: sortKey(clean(person.name) ?? '') }))
    .sort((a, b) => a.key.localeCompare(b.key, 'en', { sensitivity: 'base', numeric: true }))

  // Grouped under initial letters. Anything not starting with a letter - the
  // house byline "5Talents" - goes under # and sorts first.
  const groups: { letter: string; people: typeof people }[] = []
  for (const person of people) {
    const first = person.key.charAt(0).toUpperCase()
    const letter = /[A-Z]/.test(first) ? first : '#'
    const last = groups[groups.length - 1]
    if (last?.letter === letter) last.people.push(person)
    else groups.push({ letter, people: [person] })
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Contributors</h1>
          <p>
            Everyone who has written for 5Talents, in alphabetical order. Choose a name to read
            their articles.
          </p>
        </div>

        {people.length === 0 ? (
          <p className="empty">No contributors listed yet.</p>
        ) : (
          <>
            <nav className="az" aria-label="Jump to a letter">
              {groups.map((group) => (
                <a key={group.letter} href={`#letter-${group.letter === '#' ? 'num' : group.letter}`}>
                  {group.letter}
                </a>
              ))}
            </nav>

            <div className="contributors">
              {groups.map((group) => (
                <section
                  className="contributors__group"
                  key={group.letter}
                  id={`letter-${group.letter === '#' ? 'num' : group.letter}`}
                  aria-labelledby={`h-${group.letter === '#' ? 'num' : group.letter}`}
                >
                  <h2
                    className="contributors__letter"
                    id={`h-${group.letter === '#' ? 'num' : group.letter}`}
                  >
                    {group.letter}
                  </h2>
                  <ul className="contributors__list">
                    {group.people.map((person) => {
                      const country = clean(person.country)
                      const meta = [
                        person.role,
                        // "Unknown" is a placeholder in the data, not a place.
                        country && country.toLowerCase() !== 'unknown' ? person.country : null,
                      ].filter(Boolean)
                      return (
                        <li className="contributor" key={person._id}>
                          <div className="avatar" aria-hidden="true">
                            {person.photo?.asset?.url ? (
                              <Image
                                src={urlFor(person.photo).width(152).height(152).url()}
                                alt=""
                                width={76}
                                height={76}
                              />
                            ) : (
                              initials(clean(person.name) ?? '')
                            )}
                          </div>
                          <div>
                            <h3 className="contributor__name">
                              <Link href={`/authors/${clean(person.slug)}`}>{person.name}</Link>
                            </h3>
                            <p className="note">
                              {meta.map((item, index) => (
                                <span key={index}>
                                  {index > 0 && ' · '}
                                  {item}
                                </span>
                              ))}
                              {meta.length > 0 && ' · '}
                              {person.articleCount} {person.articleCount === 1 ? 'article' : 'articles'}
                              {person.died && (
                                <>
                                  {' · '}
                                  <em>In memoriam</em>
                                </>
                              )}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
