import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      // Photography hosted on Cloudinary rather than uploaded to Sanity.
      // See src/sanity/media.ts and studio/schemaTypes/externalImage.ts.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    // Blueprint section 7: Core Web Vitals matter for both ranking and ad revenue.
    // Keep the srcset lean; one quality level is enough for editorial photography.
    qualities: [75],
  },
  // Turbopack is the default in Next 16 for both dev and build; no flags needed.
  turbopack: {},
  // Legacy URLs from the old 5talentsmag.com that still carry backlinks.
  // Point each at the closest page on the new site so the link equity lands
  // somewhere real instead of a 404. `permanent` sends a 308, which Google
  // treats as a 301.
  async redirects() {
    return [
      // Old Stephen Devassy cover profile (~30 referring domains, mostly wiki
      // mirrors). The article itself is held - see studio/seed/articles/
      // july-2013.json - so send it to the issue it ran in.
      { source: '/stephen-devassy', destination: '/archive/july-2013', permanent: true },
      // Moved from Current to Screen on 22 Sep 2026. The old URL is in the
      // Instagram first comment and in 99 church outreach emails - keep it working.
      {
        source: '/current/the-chosen-season-6-episode-1-churches-first',
        destination: '/screen/the-chosen-season-6-episode-1-churches-first',
        permanent: true,
      },
      // Published under Current on 22 Sep 2026 while /screen was undeployed.
      // Move its section to Screen in Studio as soon as this deploy is live.
      {
        source: '/current/death-of-the-pastors-wife-netflix-mica-miller',
        destination: '/screen/death-of-the-pastors-wife-netflix-mica-miller',
        permanent: true,
      },
      // A link with "filming" mistyped as "ilming" is in circulation somewhere -
      // GA4 recorded 125 sessions on it between 19 Sep and 7 Oct, against 11 on
      // the real URL, every one of them landing on the 404. Find and fix the
      // source link too; this only stops the bleeding.
      {
        source: '/screen/the-chosen-wraps-ilming-season-7-cast-goodbye',
        destination: '/screen/the-chosen-wraps-filming-season-7-cast-goodbye',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
