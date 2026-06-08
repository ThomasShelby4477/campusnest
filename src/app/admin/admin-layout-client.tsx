'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, UserCheck, Home, AlertTriangle, Users, Trash2, Menu, X, ChevronRight } from 'lucide-react'

const navItems = [
  { label: 'Dashboard',     href: '/admin',                  icon: LayoutDashboard },
  { label: 'Verifications', href: '/admin/verifications',    icon: UserCheck },
  { label: 'Listings',      href: '/admin/listings',         icon: Home },
  { label: 'Reports',       href: '/admin/reports',          icon: AlertTriangle },
  { label: 'Users',         href: '/admin/users',            icon: Users },
  { label: 'Removed',       href: '/admin/removed-listings', icon: Trash2 },
]

// Bottom nav height used to push content clear of it on mobile
const BOTTOM_NAV_H = 60 // px — keep in sync with the nav element

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    if (!sidebarOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [sidebarOpen])

  const currentLabel = navItems.find(n => n.href === pathname)?.label ?? 'Admin'

  return (
    <>
      {/*
       * ── Desktop layout ────────────────────────────────────────
       * Sidebar: sticky, full-viewport height, scrolls its own nav items
       * Main:    natural document scroll — no overflow tricks
       *
       * ── Mobile layout ─────────────────────────────────────────
       * Top bar:    fixed at top (z-30)
       * Sidebar:    slide-in drawer (fixed, z-50)
       * Bottom nav: fixed at bottom (z-30)
       * Content:    normal flow, padded top+bottom to clear fixed bars
       */}

      {/* ── Mobile fixed top bar ─────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 bg-navy text-white"
        style={{ height: 56 }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-base font-black tracking-tight">Admin Panel</span>
        <div className="w-9" />
      </header>

      {/* ── Mobile drawer backdrop ───────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: sticky column | mobile: drawer) ── */}
      <aside
        className={[
          // Desktop: static column that sticks as page scrolls
          'md:fixed md:inset-y-0 md:left-0 md:w-64 md:translate-x-0',
          // Mobile: full-height drawer
          'fixed inset-y-0 left-0 z-50 w-64',
          'bg-navy text-white flex flex-col',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{ zIndex: sidebarOpen ? 50 : undefined }}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-black tracking-tight text-white">Admin Panel</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  active
                    ? 'bg-white text-navy shadow-md shadow-black/10'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-4 h-4 opacity-40" />}
              </Link>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10 shrink-0">
          <p className="text-[11px] text-white/40 font-medium">CampusNest Admin</p>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────── */}
      <div
        className="min-h-screen bg-muted-bg"
        style={{
          // Desktop: indent content by sidebar width
          paddingLeft: undefined,
        }}
      >
        {/* Desktop: offset for sidebar */}
        <div className="md:pl-64">

          {/* Desktop sticky breadcrumb */}
          <div className="hidden md:flex sticky top-0 z-20 items-center gap-2 px-6 h-12 bg-white border-b border-border-light">
            <span className="text-xs text-text-muted font-medium">Admin</span>
            <span className="text-xs text-text-muted/40">›</span>
            <span className="text-xs font-bold text-navy">{currentLabel}</span>
          </div>

          {/* Page content
              - Mobile: top padding = top-bar height; bottom padding = bottom-nav height
              - Desktop: normal padding, no fixed chrome to avoid */}
          <div
            className="p-4 md:p-6 lg:p-8"
            style={{
              paddingTop: undefined,
            }}
          >
            {/* Mobile spacer for fixed top bar */}
            <div className="md:hidden" style={{ height: 56 + 16 }} />

            {children}

            {/* Mobile spacer for fixed bottom nav */}
            <div className="md:hidden" style={{ height: BOTTOM_NAV_H + 16 }} />
          </div>

        </div>
      </div>

      {/* ── Mobile fixed bottom nav ──────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch bg-white border-t border-border-light"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', minHeight: BOTTOM_NAV_H }}
      >
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2',
                'text-[9px] font-bold tracking-wide transition-colors',
                active ? 'text-navy' : 'text-text-muted',
              ].join(' ')}
            >
              <div className={[
                'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                active ? 'bg-navy text-white scale-110' : '',
              ].join(' ')}>
                <Icon className="w-4 h-4" />
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
