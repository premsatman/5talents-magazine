import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { SEARCH_COUNT_QUERY, SEARCH_QUERY } from '@/sanity/queries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Card } from '@/components/Card'
import { SearchForm } from '@/components/SearchForm'
import type { ArticleCardData } from '@/components/types'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search everything 5Talents has published, back to 2012.',
  // A results page has nothing worth indexing and generates infinite URLs.
  robots: { index: false, follow: true },
}

type Props = { searchParams: Promise<{ q?: string }> }

/**
 * Search, on Sanity's GROQ `match` operator — blueprint section 7's choice, and
 * adequate under about 500 articles. No index to keep in sync, no extra
 * service, nothing to go stale.
 */
export default async function SearchPage(props: Props) {
  const { q } = await props.searchParams
  const term = (q ?? '').trim().slice(0, 80)

  // A trailing wildcard makes it prefix-match, which is what a search box
  // should do. Without it "worsh" finds nothing.
  const query = term ? `${term}*` : ''

  const [results, count] = term
    ? await Promise.all([
        sanityFetch({ query: SEARCH_QUERY, params: { q: query } }),
        sanityFetch({ query: SEARCH_COUNT_QUERY, params: { q: query }, stega: false }),
      ])
    : [{ data: [] }, { data: 0 }]

  const articles = (results.data ?? []) as ArticleCardData[]
  const total = (count.data as number) ?? 0

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Search</h1>
          <p>Everything we have published, back to the first issue in July 2012.</p>
        </div>

        <div className="searchpage">
          <SearchForm defaultValue={term} autoFocus />
        </div>

        {term ? (
          <>
            <p className="searchcount">
              {total === 0
                ? `Nothing found for “${term}”.`
                : `${total} ${total === 1 ? 'result' : 'results'} for “${term}”`}
              {total > articles.length && ` · showing the first ${articles.length}`}
            </p>

            {articles.length > 0 ? (
              <div className="grid-cards">
                {articles.map((article) => (
                  <Card key={article._id} article={article} />
                ))}
              </div>
            ) : (
              <div className="prose">
                <p>
                  Try a broader term, or browse by <Link href="/archive">issue</Link>,{' '}
                  <Link href="/interviews">cover story</Link> or section from the menu above.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="prose">
            <p>
              Search headlines, standfirsts, body copy, contributors and tags in one pass.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
