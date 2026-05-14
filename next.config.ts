import type { NextConfig } from "next";
import createMDX from '@next/mdx'

// [SECURITY M-1] Comprehensive HTTP security headers
const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Enforce HTTPS for 2 years
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Limit camera/mic/geolocation access
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  // DNS prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Firebase CDN (for service worker) + Google Maps
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://maps.googleapis.com https://maps.gstatic.com",
      // Styles: self + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + Supabase storage + data URIs
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://maps.googleapis.com https://maps.gstatic.com",
      // XHR/Fetch: self + Supabase + FCM + Google Maps API
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fcm.googleapis.com https://maps.googleapis.com",
      // Workers: self + blob (for Firebase SW)
      "worker-src 'self' blob:",
      // No embedding in foreign frames
      "frame-ancestors 'none'",
    ].join('; '),
  },
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
