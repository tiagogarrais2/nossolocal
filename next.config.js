/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone é necessário para deploy Docker/self-hosted
  // Na Vercel, omitir standalone permite ISR via CDN edge caching
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Configure headers for service worker
  async headers() {
    return [
      {
        source: "/service-worker.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
