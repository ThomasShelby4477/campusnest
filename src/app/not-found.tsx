import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <svg width="200" height="160" viewBox="0 0 200 160" fill="none" className="mx-auto mb-8">
          {/* Building outline */}
          <rect x="50" y="40" width="100" height="100" rx="8" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2" />
          {/* Windows */}
          <rect x="65" y="55" width="20" height="16" rx="3" fill="#E2E8F0" />
          <rect x="115" y="55" width="20" height="16" rx="3" fill="#E2E8F0" />
          <rect x="65" y="80" width="20" height="16" rx="3" fill="#E2E8F0" />
          <rect x="115" y="80" width="20" height="16" rx="3" fill="#E2E8F0" />
          {/* Door */}
          <rect x="88" y="105" width="24" height="35" rx="4" fill="#CBD5E1" />
          <circle cx="106" cy="122" r="2" fill="#94A3B8" />
          {/* Question mark */}
          <circle cx="155" cy="30" r="22" fill="#E8593C" opacity="0.12" />
          <text x="148" y="38" fontSize="28" fontWeight="900" fill="#E8593C" fontFamily="system-ui">?</text>
          {/* Ground line */}
          <line x1="30" y1="140" x2="170" y2="140" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <h1 className="text-6xl font-black text-navy mb-3">404</h1>
        <h2 className="text-xl font-bold text-text-primary mb-3">Page not found</h2>
        <p className="text-text-muted mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. 
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="bg-navy hover:bg-navy-dark text-white gap-2 h-12 px-6 rounded-full font-bold w-full sm:w-auto">
              <Home className="w-4 h-4" /> Back Home
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" className="gap-2 h-12 px-6 rounded-full font-bold w-full sm:w-auto">
              <Search className="w-4 h-4" /> Browse Listings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
