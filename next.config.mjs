/** @type {import('next').NextConfig} */
const nextConfig = {

  generateBuildId: async () => `build-${Date.now()}`,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Security headers for all routes
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        // Allow the /embed page to be iframed (internal)
        source: "/embed",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        // Allow the /widget page to be iframed from hire.mn
        source: "/widget",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        // Secure API routes with proper CORS
        source: "/api/ai/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,x-api-key,Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
          { key: "Content-Security-Policy", value: "default-src 'self'" },
        ],
      },
      {
        source: "/api/extract-report",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
      {

        // Chat API security
        source: "/api/chat",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST,GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // Embed script caching
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
        ],
      },
      {
        // Preconnect to Spline CDN on widget/embed pages
        source: "/(embed|widget)",
        headers: [
          {
            key: "Link",
            value: [
              '<https://prod.spline.design>; rel=preconnect',
              '<https://prod.spline.design>; rel=dns-prefetch',
            ].join(', '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
