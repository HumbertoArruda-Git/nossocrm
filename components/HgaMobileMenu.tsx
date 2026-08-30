'use client'

import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'

const links = [
  ['Serviços', '#servicos'],
  ['Soluções', '#solucoes'],
  ['Como trabalhamos', '#processo'],
  ['Contato', '#contato'],
]

export function HgaMobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="hga-mobile-menu">
      <button className="hga-menu" type="button" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      {open && <div className="hga-mobile-panel">
        <nav aria-label="Navegação mobile">
          {links.map(([label, href]) => <a href={href} key={href} onClick={() => setOpen(false)}>{label}</a>)}
        </nav>
        <a className="hga-header-cta" href="#contato" onClick={() => setOpen(false)}>Falar com a HGA <ArrowRight size={16} /></a>
      </div>}
    </div>
  )
}
