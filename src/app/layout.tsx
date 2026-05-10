import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/navbar'
import { ConsentBanner } from '@/components/consent-banner'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Navbar />
          {children}
          <ConsentBanner />
        </Providers>
      </body>
    </html>
  )
}
