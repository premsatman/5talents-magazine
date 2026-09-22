'use client'

import { useState } from 'react'

/**
 * The official trailer as an article's lead - a "facade".
 *
 * Shows YouTube's own thumbnail with a play button, and only swaps in the real
 * player when the reader clicks. That keeps the page fast (no YouTube script
 * or cookies until play) and keeps the picture where it belongs: the thumbnail
 * is loaded straight from YouTube's servers as part of their video, never
 * copied, resized or re-hosted by us. That is why this is a plain <img>, not
 * next/image - next/image would fetch it and serve our own copy.
 *
 * Only for official trailers, switched on per article with
 * screenMeta.trailerAsHero. Our own card still carries the homepage, social
 * shares and Discover, where a thumbnail would stand alone as a photo.
 */
export function TrailerHero({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false)

  return (
    <figure className="piecehero__frame trailerhero">
      <div className="trailerhero__box">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" className="trailerhero__play" onClick={() => setPlaying(true)} aria-label={`Play: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
              alt=""
              fetchPriority="high"
              onError={(e) => {
                // Not every upload has a maxres thumbnail; hq always exists.
                const img = e.currentTarget
                if (!img.src.includes('hqdefault')) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
              }}
            />
            <span className="trailerhero__icon" aria-hidden="true" />
          </button>
        )}
      </div>
      <figcaption>{title}. Official trailer, from YouTube.</figcaption>
    </figure>
  )
}
