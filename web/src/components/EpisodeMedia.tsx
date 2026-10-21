'use client'

import { useState } from 'react'
import Link from 'next/link'
import { articleHref } from '@/lib/site'
import { formatClock, parseTimestamp, youtubeAt, type Chapter } from '@/lib/podcast'

/**
 * The episode's video and its chapter list, together.
 *
 * Chapters are plain links to YouTube at the right second, so they work with
 * no JavaScript and in a feed reader. With JavaScript, a click re-points the
 * embedded player at that second instead of sending the reader off the site.
 * No YouTube iframe API: changing `start` on the embed URL is enough, and it
 * keeps a third-party script off the page.
 */
export function EpisodeMedia({
  videoId,
  title,
  chapters,
}: {
  videoId: string | null
  title: string
  chapters: Chapter[]
}) {
  const [start, setStart] = useState<number | null>(null)

  const src = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0${start !== null ? `&start=${start}&autoplay=1` : ''}`
    : null

  return (
    <>
      {src && (
        <figure className="episode-video">
          <div className="watchit-frame">
            <iframe
              key={src}
              src={src}
              title={title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </figure>
      )}

      {chapters.length > 0 && (
        <section className="episode-chapters" aria-labelledby="chapters-head">
          <h2 id="chapters-head">In this episode</h2>
          <ol>
            {chapters.map((c, i) => {
              const seconds = parseTimestamp(c.start)
              const article = c.article
              return (
                <li key={c._key ?? i}>
                  {videoId ? (
                    <a
                      className="episode-chapters__time"
                      href={youtubeAt(videoId, seconds)}
                      onClick={(e) => {
                        e.preventDefault()
                        setStart(seconds)
                        // Bring the player into view on a phone, where the
                        // list sits below it.
                        document.querySelector('.episode-video')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }}
                    >
                      {formatClock(seconds)}
                    </a>
                  ) : (
                    <span className="episode-chapters__time">{formatClock(seconds)}</span>
                  )}
                  <div>
                    <p className="episode-chapters__title">{c.title}</p>
                    {article?.slug && article.section && (
                      <p className="episode-chapters__read">
                        Read:{' '}
                        <Link className="brush-link" href={articleHref(article.section, article.slug)}>
                          {article.title}
                        </Link>
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </>
  )
}
