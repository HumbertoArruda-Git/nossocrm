import type { MouseEvent } from 'react'

/**
 * Faz a rolagem até uma âncora da própria página, sem depender do hash.
 *
 * O <Link> do Next não faz nada quando a URL já está no hash de destino. Como
 * o primeiro clique grava "#solucoes" mesmo quando a rolagem não acontece,
 * todos os cliques seguintes viram no-op — a URL não muda, então não há
 * navegação. Rolando explicitamente, todo clique tem o mesmo resultado.
 *
 * Não passa `behavior`: assim herda o `scroll-behavior` do CSS, que é suave
 * por padrão e instantâneo sob prefers-reduced-motion. O `scroll-padding-top`
 * do html também é respeitado, então a seção não para atrás do header.
 *
 * @returns true se tratou o clique; false quando o alvo não está nesta página
 *          (aí o Link deve navegar normalmente).
 */
export function scrollToHash(event: MouseEvent<HTMLAnchorElement>, href: string): boolean {
  // Cliques com modificador (nova aba, nova janela) seguem o caminho normal.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  // `button` só é checado quando existe de fato: em cliques sintetizados por
  // toque ou teclado ele pode vir ausente, e comparar direto com 0 fazia a
  // função desistir justamente no celular.
  if (typeof event.button === 'number' && event.button !== 0) return false

  const hash = href.split('#')[1]
  if (!hash) return false

  const target = document.getElementById(hash)
  if (!target) return false

  event.preventDefault()
  // Mantém a URL coerente sem criar entrada no histórico — e sem depender
  // dela para rolar, que era justamente o problema.
  window.history.replaceState(null, '', href)

  // Rola no próximo quadro, e não agora.
  //
  // No menu mobile o clique também fecha o painel, o que dispara um re-render:
  // o painel recebe `inert` e o foco sai do link clicado. Uma rolagem suave
  // iniciada antes disso é cancelada no meio do caminho pela mudança de foco.
  // Esperar o quadro seguinte garante que o DOM já assentou.
  requestAnimationFrame(() => target.scrollIntoView())
  return true
}
