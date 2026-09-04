import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/live'
import { TALENT_SEARCH_QUERY } from '@/sanity/queries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ArticleCard } from '@/components/ArticleCard'
import { AdSlot } from '@/components/AdSlot'
import type { ArticleCardData } from '@/components/types'

export const metadata: Metadata = {
  title: 'Talent search',
  description:
    'Short profiles of working Christian artists, musicians and makers. The original 5Talents franchise, revived.',
  alternates: { canonical: '/talent-search' },
}

export default async function TalentSearchPage() {
  const { data } = await sanityFetch({ query: TALENT_SEARCH_QUERY })
  const articles = (data ?? []) as ArticleCardData[]

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Talent search</h1>
          <p>
            Short profiles of working Christian artists, musicians and makers. It is the franchise
            the magazine ran from 2012, and the reason for the name.
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="empty">No profiles published yet.</p>
        ) : (
          <div className="grid-cards">
            {articles.map((article, index) => (
              <ArticleCard key={article._id} article={article} priority={index === 0} />
            ))}
          </div>
        )}

        <AdSlot slot="F" seed="talent-search" />
      </main>
      <SiteFooter />
    </>
  )
}
