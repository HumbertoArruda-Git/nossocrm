'use client'

import { useEffect } from 'react'
import { scrollToHash } from '@/components/landing/scrollToHash'

/**
 * Garante que todo link para uma âncora da própria página role de fato.
 *
 * O problema não é só do menu: os botões do hero ("Ver soluções", "Falar sobre
 * o seu caso"), o CTA do header, o convite no meio da página e o rodapé apontam
 * todos para hashes desta mesma página. Em qualquer um deles, uma vez que a URL
 * já esteja no hash de destino, o <Link> do Next não faz nada.
 *
 * Um listener delegado resolve os cinco pontos de uma vez, e continua valendo
 * para qualquer link que apareça depois — melhor do que repetir o mesmo handler
 * em cada componente.
 *
 * Ignora cliques já tratados (`defaultPrevented`), então o menu mobile, que
 * precisa fechar o painel além de rolar, continua com o handler próprio sem
 * que a rolagem aconteça duas vezes.
 */
export function AnchorScroll() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return

      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href*="#"]')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Só âncoras desta página: "#contato" ou "/#contato".
      if (!href.startsWith('#') && !href.startsWith('/#')) return

      scrollToHash(event as unknown as React.MouseEvent<HTMLAnchorElement>, href)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
