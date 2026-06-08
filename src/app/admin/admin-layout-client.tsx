'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, UserCheck, Home, AlertTriangle, Users, Trash2, Menu, X, ChevronLeft } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Verifications', href: '/admin/verifications', icon: UserCheck },
  { label: 'Listings', href: '/admin/listings', icon: Home },
  { label: 'Reports', href: '/admin/reports', icon: AlertTriangle },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Removed', href: '/admin/removed-listings', icon: Trash2 },
]

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Dismiss on Escape key
  useEffect(() => {
    if (!sidebarOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [sidebarOpen])

  const currentLabel = navItems.find(n => n.href === pathname)?.label ?? 'Admin'

  return (
    <div className="h-dvh overflow-hidden bg-muted-bg flex flex-col">

      {/* ── Mobile Top Bar ─────────────────────────────────────── */}
      <header className="flex md:hidden items-center justify-between px-4 h-14 bg-navy text-white shrink-0 z-30">
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

      <div className="flex flex-1 min-h-0">

        {/* ── Mobile Drawer Backdrop ─────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside
          className={`
            fixed md:relative inset-y-0 left-0 z-50 md:z-auto
            w-64 bg-navy text-white flex flex-col shrink-0
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-white/10 shrink-0">
            <h2 className="text-xl font-black tracking-tight text-white">Admin Panel</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? 'bg-white text-navy shadow-md shadow-black/10'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <ChevronLeft className="w-4 h-4 ml-auto rotate-180 opacity-40" />}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-6 py-4 border-t border-white/10 shrink-0">
            <p className="text-[11px] text-white/40 font-medium">CampusNest Admin</p>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* Desktop breadcrumb bar */}
          <div className="hidden md:flex items-center gap-2 px-6 h-12 bg-white border-b border-border-light shrink-0">
            <span className="text-xs text-text-muted font-medium">Admin</span>
            <span className="text-text-muted/40 text-xs">›</span>
            <span className="text-xs font-bold text-navy">{currentLabel}</span>
          </div>

          <div className="p-4 md:p-6 lg:p-8 pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ──────────────────────────────────── */}
      <nav className="md:hidden flex items-stretch bg-white border-t border-border-light shrink-0 z-30">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 py-2
                text-[9px] font-bold tracking-wide transition-colors
                ${isActive ? 'text-navy' : 'text-text-muted'}
              `}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-navy text-white scale-110' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
