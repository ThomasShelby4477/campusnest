'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  stagger?: boolean
  delay?: number
}

export function ScrollReveal({ children, className = '', stagger = false, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.classList.add('visible')
            }, delay)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`reveal ${stagger ? 'reveal-stagger' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
