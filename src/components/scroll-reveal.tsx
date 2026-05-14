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

    // Respect prefers-reduced-motion — immediately show content without animation
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      el.classList.add('visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Use requestAnimationFrame to batch DOM mutations with the browser paint
            // This prevents mid-scroll jank from synchronous style recalcs
            const timeout = delay > 0
              ? setTimeout(() => requestAnimationFrame(() => el.classList.add('visible')), delay)
              : null

            if (delay > 0) {
              // timeout already scheduled above
            } else {
              requestAnimationFrame(() => el.classList.add('visible'))
            }

            observer.unobserve(el)

            return () => {
              if (timeout) clearTimeout(timeout)
            }
          }
        })
      },
      {
        // Lower threshold on mobile (smaller viewport) — fires more reliably
        threshold: 0.05,
        // Larger negative bottom margin so reveal fires earlier — prevents elements
        // appearing already mid-screen as user scrolls fast on mobile
        rootMargin: '0px 0px -20px 0px',
      }
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
