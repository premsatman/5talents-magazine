import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/studio'] },
    ],
    // No `host`. It is a Yandex-only directive, Google ignores it, and it takes
    // a bare hostname rather than the URL siteUrl holds - so it was wrong as
    // well as unread.
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/news-sitemap.xml`],
  }
}
