import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/navbar'
import { ConsentBanner } from '@/components/consent-banner'
import { SuspensionGuard } from '@/components/suspension-guard'
import { headers } from 'next/headers'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CampusNest — Student Housing & Roommate Finder',
    template: '%s | CampusNest',
  },
  description:
    'Find affordable student housing and compatible roommates near NFSU. Verified listings, smart matching, and secure chat — all in one place.',
  keywords: [
    'student housing',
    'NFSU',
    'roommate finder',
    'PG near NFSU',
    'Gandhinagar accommodation',
    'college housing',
  ],
  authors: [{ name: 'CampusNest' }],
  openGraph: {
    title: 'CampusNest — Student Housing & Roommate Finder',
    description:
      'Find affordable student housing and compatible roommates near NFSU.',
    siteName: 'CampusNest',
    type: 'website',
  },
}

// Separate viewport export — required by Next.js 14+ for correct mobile viewport control.
// Prevents iOS Safari keyboard from causing full-page scroll jumps.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow pinch-zoom (accessibility), cap excessive zoom
  interactiveWidget: 'resizes-content',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''

  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans bg-background text-foreground overflow-x-hidden">
        <Providers>
          <SuspensionGuard pathname={pathname} />
          <Navbar />
          {children}
          <ConsentBanner />
        </Providers>
      </body>
    </html>
  )
}
