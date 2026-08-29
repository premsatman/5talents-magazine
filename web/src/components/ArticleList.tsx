import Link from 'next/link'
import { articleHref } from '@/lib/site'
import { joinNames } from '@/lib/format'
import { clean } from '@/sanity/stega'
import type { ArticleCardData } from './types'

/** The numbered "Latest" list from homepage.html. */
export function ArticleList({ articles }: { articles: ArticleCardData[] }) {
  if (articles.length === 0) return <p className="empty">Nothing here yet.</p>

  return (
    <div className="latest">
      <ol>
        {articles.map((article, index) => (
          <li key={article._id}>
            <span className="num" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3>
                <Link
                  className="brush-link"
                  href={articleHref(clean(article.section?.slug), clean(article.slug))}
                >
                  {article.title}
                </Link>
              </h3>
              <p className="note">
                {[article.section?.name, joinNames(article.authors)].filter(Boolean).join(' · ')}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
