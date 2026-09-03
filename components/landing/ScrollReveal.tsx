'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right'
}

// useLayoutEffect runs before paint on the client, but warns during SSR.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * Reveal-on-scroll that degrades safely.
 *
 * The content renders VISIBLE by default (no opacity:0 in the SSR output), so if
 * JavaScript never runs — or hydration fails — the content is still on screen.
 * The hidden state is only ever applied by the client, before paint, and only for
 * elements that are still below the fold.
 */
export function ScrollReveal({ children, className, delay = 0, direction = 'up' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'static' | 'armed' | 'in'>('static')

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Already in view at mount (above the fold): leave it visible, never hide it.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return

    setState('armed')
  }, [])

  useEffect(() => {
    if (state !== 'armed') return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('in')
            observer.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [state])

  return (
    <div
      ref={ref}
      className={className}
      data-reveal={state === 'static' ? undefined : state}
      data-reveal-dir={direction}
      style={state !== 'static' && delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}
