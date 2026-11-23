/** @type {import('next').NextConfig} */
// TODO: tighten CSP once third-party scripts (GA4, Turnstile) are finalized.
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // TODO: replace with actual R2 public bucket domain
        hostname: '*.r2.dev',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          // TODO: add full CSP header
        ],
      },
    ];
  },
  async redirects() {
    // TODO: add legacy URL redirects as needed
    return [];
  },
};

module.exports = nextConfig;
