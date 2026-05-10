import { ReactNode } from 'react'

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted-bg py-12 px-4">
      <article className="max-w-3xl mx-auto bg-white rounded-2xl border border-border-light p-8 sm:p-12 shadow-sm prose-campusnest">
        {children}
      </article>
    </div>
  )
}
