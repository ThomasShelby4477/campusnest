import type { NextConfig } from "next";
import createMDX from '@next/mdx'

// [SECURITY M-1] Comprehensive HTTP security headers
// NOTE: Content-Security-Policy is intentionally absent here.
// It is generated dynamically per-request in src/middleware.ts with a
// per-request nonce so unsafe-inline can be removed from script-src.
const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Enforce HTTPS for 2 years
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Limit camera/mic/geolocation access
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  // DNS prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  // [SECURITY H-3] Removed hardcoded dev IPs and ngrok URL.
  // Use NEXT_PUBLIC_SITE_URL or configure per environment if needed.

  images: {
    // [SECURITY C-3] Replaced wildcard '**' with specific Supabase domain.
    // This prevents SSRF via the Next.js image optimizer proxy.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

export default withMDX(nextConfig);
