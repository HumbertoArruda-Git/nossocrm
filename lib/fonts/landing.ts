import { IBM_Plex_Mono, Instrument_Sans } from 'next/font/google'

/**
 * Tipografia da landing pública.
 *
 * Dois papéis, escolhidos por função e não por gosto:
 *  - Instrument Sans (display) carrega os títulos. É uma grotesca com desenho
 *    próprio — não é o Inter do corpo de texto, então o título tem voz.
 *  - IBM Plex Mono (utilitária) marca tudo que é dado: rótulos de seção,
 *    numeração do processo, categorias, fontes das estatísticas. Monoespaçada
 *    é o vernáculo de quem trabalha com sistema; aqui ela diz "isto é medida",
 *    não "isto é enfeite".
 *
 * O corpo continua em Inter (carregado no layout raiz) e a assinatura HGA
 * continua em Exo 2 — a marca não muda.
 */

export const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hga-display',
  display: 'swap',
})

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-hga-mono',
  display: 'swap',
})
