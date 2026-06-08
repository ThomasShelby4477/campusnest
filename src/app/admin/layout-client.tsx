'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UserCheck, Home, AlertTriangle,
  Users, Trash2, Menu, X, ChevronRight, ArrowLeft,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',     href: '/admin',                  icon: LayoutDashboard, short: 'Dash'    },
  { label: 'Verifications', href: '/admin/verifications',    icon: UserCheck,        short: 'Verify'  },
  { label: 'Listings',      href: '/admin/listings',         icon: Home,             short: 'List'    },
  { label: 'Reports',       href: '/admin/reports',          icon: AlertTriangle,    short: 'Reports' },
  { label: 'Users',         href: '/admin/users',            icon: Users,            short: 'Users'   },
  { label: 'Removed',       href: '/admin/removed-listings', icon: Trash2,           short: 'Removed' },
]

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const activeItem = navItems.find(n => isActive(n.href))

  return (
    /*
     * Desktop layout: h-dvh + overflow-hidden on the root locks the whole shell
     * to exactly one viewport height — the body never scrolls.
     * Only the <main> area inside scrolls (overflow-y-auto).
     *
     * Mobile layout: normal document flow (the root grows with content),
     * mobile top-bar is sticky, bottom tab-bar is fixed.
     */
    <div className="md:h-dvh md:overflow-hidden bg-[#F1F5F9] flex flex-col md:flex-row">

      {/* ── Mobile overlay backdrop ─────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══════════════════════════════════════════════════
          SIDEBAR
          • Mobile: slides in from left (fixed positioning)
          • Desktop: static left column, h-full so it fills the locked shell
      ══════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[#0F2442] text-white flex flex-col
          transform transition-transform duration-300 ease-out will-change-transform
          md:relative md:inset-auto md:translate-x-0 md:w-64 md:flex-shrink-0 md:h-full
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.08] flex-shrink-0">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-coral/80 block mb-0.5">CampusNest</span>
            <h2 className="text-lg font-black text-white leading-none">Admin Panel</h2>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold
                  transition-all duration-150 group relative
                  ${active
                    ? 'bg-white/[0.12] text-white'
                    : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
                  }
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-coral rounded-r-full" />
                )}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  transition-all duration-150
                  ${active ? 'bg-coral text-white shadow-lg shadow-coral/30' : 'bg-white/[0.08] text-white/60 group-hover:bg-white/[0.12] group-hover:text-white'}
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 leading-none">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/[0.08] flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          MAIN COLUMN
          • md:h-full — fills the locked shell height
          • md:overflow-hidden — clips children; only <main> scrolls
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 md:h-full md:overflow-hidden">

        {/* ── Mobile top bar ─────────────────────────────── */}
        <header className="md:hidden sticky top-0 z-30 bg-[#0F2442] flex items-center gap-3 px-4 h-14 flex-shrink-0 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            {activeItem && (
              <>
                <div className="w-7 h-7 rounded-lg bg-coral/90 flex items-center justify-center shrink-0">
                  <activeItem.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-white truncate">{activeItem.label}</span>
              </>
            )}
          </div>

          <span className="text-xs text-white/40 font-medium">CampusNest</span>
        </header>

        {/* ── Page content — THIS is the only scrolling element on desktop ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-8 pb-20 md:pb-8">
          {children}
        </main>

        {/* ══════════════════════════════════════════════════
            MOBILE BOTTOM TAB BAR
        ══════════════════════════════════════════════════ */}
        <nav
          aria-label="Admin navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100
                     flex items-stretch"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {navItems.map(({ short, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0
                  text-[9px] font-bold tracking-wide uppercase transition-colors
                  ${active ? 'text-coral' : 'text-gray-400 hover:text-gray-600'}
                `}
              >
                <div className={`relative flex items-center justify-center w-7 h-7 rounded-xl transition-all duration-200
                  ${active ? 'bg-coral/10 scale-110' : ''}`}>
                  <Icon className={`w-[18px] h-[18px] transition-colors ${active ? 'text-coral' : ''}`} />
                  {active && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-coral rounded-full" />
                  )}
                </div>
                <span className="leading-none truncate w-full text-center px-0.5">{short}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
