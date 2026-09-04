'use client'

import { useEffect } from 'react'

/**
 * Realce que segue o ponteiro nos elementos marcados com `data-glow`.
 *
 * Progressive enhancement puro: sem JS (ou em touch / reduced-motion) os
 * elementos continuam com o hover normal do CSS. Um único listener delegado
 * na janela — não há listener por card.
 */
export function PointerGlow() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let frame = 0
    let pending: { el: HTMLElement; x: number; y: number } | null = null

    function flush() {
      frame = 0
      if (!pending) return
      pending.el.style.setProperty('--hga-mx', `${pending.x}px`)
      pending.el.style.setProperty('--hga-my', `${pending.y}px`)
      pending = null
    }

    function handleMove(event: PointerEvent) {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-glow]')
      if (!target) return
      const rect = target.getBoundingClientRect()
      pending = { el: target, x: event.clientX - rect.left, y: event.clientY - rect.top }
      if (!frame) frame = requestAnimationFrame(flush)
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handleMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
