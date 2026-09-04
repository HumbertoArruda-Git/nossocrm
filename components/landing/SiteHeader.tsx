import Link from 'next/link'
import { HeaderShell } from '@/components/landing/HeaderShell'
import { HgaMobileMenu } from '@/components/landing/HgaMobileMenu'

export function SiteHeader() {
  return (
    <HeaderShell>
      <header className="hga-header">
        <Link className="hga-wordmark" href="/#inicio" aria-label="HGA Systems — início">
          <span className="hga-wordmark-name"><b>H</b><b>G</b><b className="hga-wordmark-a">A</b></span>
          <small>SYSTEMS</small>
        </Link>
        <nav className="hga-nav" aria-label="Navegação principal">
          <Link href="/#solucoes">Soluções</Link>
          <Link href="/#processo">Processo</Link>
          <Link href="/#mercado">Mercado</Link>
          <Link href="/#contato">Contato</Link>
        </nav>
        <Link className="hga-header-cta" href="/#contato">Falar com a gente</Link>
        <HgaMobileMenu />
      </header>
    </HeaderShell>
  )
}
