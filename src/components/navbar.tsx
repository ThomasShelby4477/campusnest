'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationsBell } from './notifications-bell'
import { useAuthStore } from '@/stores/auth-store'
import { Search, MessageSquare, Heart, User } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  // Hide navbar on auth pages and individual chats
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/chat/')) {
    return null
  }

  // Hide navbar on admin pages (admin has its own sidebar)
  if (pathname.startsWith('/admin')) {
    return null
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <>
      {/* ── Desktop Top Navbar ──────────────────────────────── */}
      <nav className="h-16 border-b border-border-light bg-white flex items-center px-4 sm:px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-navy italic tracking-tight">
            CampusNest.
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/search" className={`text-sm font-bold hidden sm:block transition-colors ${isActive('/search') ? 'text-navy' : 'text-text-muted hover:text-navy'}`}>Search</Link>
              <Link href="/chats" className={`text-sm font-bold hidden sm:block transition-colors ${isActive('/chats') ? 'text-navy' : 'text-text-muted hover:text-navy'}`}>Chats</Link>
              <Link href="/saved" className={`text-sm font-bold hidden sm:block transition-colors ${isActive('/saved') ? 'text-navy' : 'text-text-muted hover:text-navy'}`}>Saved</Link>
              <Link href="/my-listings" className={`text-sm font-bold hidden sm:block transition-colors ${isActive('/my-listings') ? 'text-navy' : 'text-text-muted hover:text-navy'}`}>My Listings</Link>
              
              <div className="h-6 w-px bg-border-light mx-2 hidden sm:block" />
              
              <NotificationsBell />
              
              <Link href="/profile" className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ml-2 transition-colors ${isActive('/profile') ? 'bg-navy text-white' : 'bg-navy/10 text-navy'}`}>
                {user.name?.charAt(0) || 'U'}
              </Link>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href="/login" className="text-sm font-bold text-navy px-4 py-2 hover:bg-navy/5 rounded-full transition-colors">
                Log in
              </Link>
              <Link href="/signup" className="text-sm font-bold bg-coral text-white px-4 py-2 rounded-full hover:bg-coral-dark transition-colors">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Mobile Bottom Tab Bar ──────────────────────────── */}
      {user && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border-light h-16 flex items-center justify-around px-2 pb-safe">
          <Link href="/search" className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${isActive('/search') ? 'text-coral' : 'text-text-muted'}`}>
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold">Search</span>
          </Link>
          <Link href="/chats" className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${isActive('/chats') ? 'text-coral' : 'text-text-muted'}`}>
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-bold">Chats</span>
          </Link>
          <Link href="/saved" className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${isActive('/saved') ? 'text-coral' : 'text-text-muted'}`}>
            <Heart className="w-5 h-5" />
            <span className="text-[10px] font-bold">Saved</span>
          </Link>
          <Link href="/profile" className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${isActive('/profile') ? 'text-coral' : 'text-text-muted'}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      )}
    </>
  )
}
