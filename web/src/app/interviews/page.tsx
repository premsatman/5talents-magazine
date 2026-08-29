import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/live'
import { COVER_STORIES_QUERY } from '@/sanity/queries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ArticleCard } from '@/components/ArticleCard'
import { AdSlot } from '@/components/AdSlot'
import type { ArticleCardData } from '@/components/types'

export const metadata: Metadata = {
  title: 'Cover stories',
  description:
    'The long-form interview, alternating India and international. Every cover story 5Talents has published.',
  alternates: { canonical: '/interviews' },
}

export default async function InterviewsPage() {
  const { data } = await sanityFetch({ query: COVER_STORIES_QUERY })
  const articles = (data ?? []) as ArticleCardData[]

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Cover stories</h1>
          <p>
            The long-form interview — our signature. It alternates between India and the rest of
            the world, the way the magazine always did.
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="empty">No cover stories published yet.</p>
        ) : (
          <div className="grid g3">
            {articles.map((article, index) => (
              <ArticleCard key={article._id} article={article} priority={index === 0} />
            ))}
          </div>
        )}

        <AdSlot slot="F" />
      </main>
      <SiteFooter />
    </>
  )
}
