import Link from 'next/link'
import { HgaMobileMenu } from '@/components/landing/HgaMobileMenu'

export function SiteHeader() {
  return (
    <header className="hga-header">
      <Link className="hga-wordmark" href="/#inicio" aria-label="HGA Systems — início">
        <span className="hga-wordmark-name"><b>H</b><b>G</b><b className="hga-wordmark-a">A</b></span>
        <small>SYSTEMS</small>
      </Link>
      <nav className="hga-nav" aria-label="Navegação principal">
        <Link href="/#solucoes">Soluções</Link><Link href="/#capacidade">Sistemas</Link><Link href="/#processo">Processo</Link><Link href="/#contato">Contato</Link>
      </nav>
      <Link className="hga-header-cta" href="/#solucoes">Conhecer soluções</Link>
      <HgaMobileMenu />
    </header>
  )
}
