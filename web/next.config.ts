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
}

export default nextConfig
