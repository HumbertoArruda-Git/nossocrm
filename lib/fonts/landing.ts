import { Archivo, IBM_Plex_Mono } from 'next/font/google'

/**
 * Tipografia da landing pública — duas famílias, dois papéis.
 *
 * Archivo carrega título e corpo. É uma grotesca de linhagem industrial
 * (parente das gothics de sinalização), então em corpo grande e entrelinha
 * curta soa a engenharia, não a startup. Sistema de uma família só é escolha
 * de estúdio: dá coesão sem precisar de contraste entre duas sans genéricas.
 *
 * IBM Plex Mono marca tudo que é dado: rótulos de seção, numeração do
 * processo, categorias, fontes das estatísticas, campos do formulário.
 * Monoespaçada é o vernáculo de quem trabalha com sistema — aqui ela diz
 * "isto é medida", não "isto é enfeite".
 *
 * O Inter fica só no app (layout raiz); a assinatura HGA continua em Exo 2.
 */

export const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  // corpo 400, rótulos e botões 500, títulos 600 — 700 não é usado
  weight: ['400', '500', '600'],
  variable: '--font-hga-sans',
  display: 'swap',
})

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-hga-mono',
  display: 'swap',
})
