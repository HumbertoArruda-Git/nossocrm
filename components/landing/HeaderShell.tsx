'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Barra fixa de vidro no topo.
 *
 * A hairline inferior só aparece depois que a página sai do topo — no topo o
 * header precisa parecer parte do hero, não uma faixa colada por cima dele.
 * A detecção usa uma sentinela de 1px observada por IntersectionObserver, em
 * vez de listener de scroll (não roda a cada frame de rolagem).
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div className="hga-header-sentinel" ref={sentinelRef} aria-hidden="true" />
      <div className="hga-header-shell" data-stuck={stuck}>
        {children}
      </div>
    </>
  )
}
