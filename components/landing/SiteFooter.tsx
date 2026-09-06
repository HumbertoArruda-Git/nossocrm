import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="hga-footer">
      <Link className="hga-wordmark" href="/#inicio">
        <span className="hga-wordmark-name"><b>H</b><b>G</b><b className="hga-wordmark-a">A</b></span>
        <small>SYSTEMS</small>
      </Link>
      <nav className="hga-footer-nav" aria-label="Navegação do rodapé">
        <Link href="/#solucoes">Soluções</Link>
        <Link href="/#processo">Processo</Link>
        <Link href="/#mercado">Mercado</Link>
        <Link href="/#contato">Contato</Link>
        <Link href="/privacidade">Privacidade</Link>
      </nav>
      <div className="hga-footer-meta">
        <span>hgasystems.com.br</span>
        <span>© HGA Systems</span>
      </div>
    </footer>
  )
}
