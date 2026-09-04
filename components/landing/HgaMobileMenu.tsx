'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { scrollToHash } from '@/components/landing/scrollToHash'

const links = [
  ['Soluções', '/#solucoes'],
  ['Processo', '/#processo'],
  ['Mercado', '/#mercado'],
  ['Contato', '/#contato'],
]

export function HgaMobileMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Fecha o painel em todo caso; a rolagem só é assumida quando o alvo está
  // nesta página (fora dela, o Link navega normalmente).
  function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setOpen(false)
    scrollToHash(event, href)
  }

  return (
    <div className="hga-mobile-menu" ref={rootRef}>
      <button
        className="hga-menu"
        type="button"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        aria-controls="hga-mobile-panel"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
      </button>
      <div className="hga-mobile-panel" id="hga-mobile-panel" data-open={open} inert={!open}>
        <nav aria-label="Navegação mobile">
          {links.map(([label, href]) => (
            <Link href={href} key={href} onClick={(event) => handleNavClick(event, href)}>
              {label}
            </Link>
          ))}
        </nav>
        <Link
          className="hga-header-cta"
          href="/#contato"
          onClick={(event) => handleNavClick(event, '/#contato')}
        >
          Falar com a gente <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
