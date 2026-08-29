import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { freshClient } from '@/sanity/client'
import { AUTHOR_ARTICLES_QUERY, AUTHOR_QUERY, AUTHOR_SLUGS_QUERY } from '@/sanity/queries'
import { urlFor } from '@/sanity/image'
import { clean } from '@/sanity/stega'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ArticleCard } from '@/components/ArticleCard'
import type { ArticleCardData } from '@/components/types'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const authors = await freshClient.fetch(AUTHOR_SLUGS_QUERY)
  return (authors ?? []).filter((a) => a.slug).map((a) => ({ slug: a.slug as string }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const { data } = await sanityFetch({ query: AUTHOR_QUERY, params: { slug }, stega: false })
  if (!data) return {}
  return {
    title: data.name ?? slug,
    description: data.bio ?? `Articles by ${data.name} in 5Talents Magazine.`,
    alternates: { canonical: `/authors/${slug}` },
  }
}

export default async function AuthorPage(props: Props) {
  const { slug } = await props.params
  const [profile, list] = await Promise.all([
    sanityFetch({ query: AUTHOR_QUERY, params: { slug } }),
    sanityFetch({ query: AUTHOR_ARTICLES_QUERY, params: { slug } }),
  ])
  if (!profile.data) notFound()

  const author = profile.data
  const articles = (list.data ?? []) as ArticleCardData[]

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <div className="authorcard" style={{ border: 0, margin: 0, padding: 0 }}>
            <div className="avatar" aria-hidden="true">
              {author.photo?.asset?.url ? (
                <Image
                  src={urlFor(author.photo).width(152).height(152).url()}
                  alt=""
                  width={76}
                  height={76}
                />
              ) : (
                (author.name ?? '')
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              )}
            </div>
            <div>
              <h1 style={{ marginBottom: 'var(--s-1)' }}>{author.name}</h1>
              <p className="note">
                {[author.role, author.institution, author.country].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          {author.bio && <p style={{ marginTop: 'var(--s-3)' }}>{author.bio}</p>}
          {(author.socials ?? []).length > 0 && (
            <p className="note" style={{ marginTop: 'var(--s-2)' }}>
              {(author.socials ?? []).map((social, index) => (
                <span key={social?.url ?? index}>
                  {index > 0 && ' · '}
                  <a href={clean(social?.url) ?? '#'} rel="noopener noreferrer me" target="_blank">
                    {social?.platform}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>

        {articles.length === 0 ? (
          <p className="empty">Nothing published yet.</p>
        ) : (
          <div className="grid g3">
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
