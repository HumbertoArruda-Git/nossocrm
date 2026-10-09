import Link from 'next/link'
import { HGA_CONTACT, WHATSAPP_URL } from '@/lib/seo/site'

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
        <Link href="/#duvidas">Dúvidas</Link>
        <Link href="/#contato">Contato</Link>
        <Link href="/privacidade">Privacidade</Link>
      </nav>
      <div className="hga-footer-meta">
        <a href={`mailto:${HGA_CONTACT.email}`}>{HGA_CONTACT.email}</a>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp {HGA_CONTACT.phoneDisplay}</a>
        <span>{HGA_CONTACT.city}, {HGA_CONTACT.region}</span>
        <span>© HGA Systems</span>
      </div>
    </footer>
  )
}
