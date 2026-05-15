import { ReactNode } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, UserCheck, Home, AlertTriangle, Users, Trash2 } from 'lucide-react'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'ADMIN') redirect('/')

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Verifications', href: '/admin/verifications', icon: UserCheck },
    { label: 'Listings', href: '/admin/listings', icon: Home },
    { label: 'Reports', href: '/admin/reports', icon: AlertTriangle },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Removed', href: '/admin/removed-listings', icon: Trash2 },
  ]

  return (
    <div className="h-dvh overflow-hidden bg-muted-bg flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-navy text-white flex-shrink-0">
        <div className="p-6">
          <h2 className="text-xl font-black tracking-tight text-white mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
