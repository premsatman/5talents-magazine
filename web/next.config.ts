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
    ]
  },
}

export default nextConfig
