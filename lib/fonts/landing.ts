import { Archivo, IBM_Plex_Mono } from 'next/font/google'

/**
 * Tipografia da landing pública — duas famílias, dois papéis.
 *
 * Archivo carrega título e corpo. É uma grotesca de linhagem industrial
 * (parente das gothics de sinalização), então em corpo grande e entrelinha
 * curta soa a engenharia, não a startup. Sistema de uma família só é escolha
 * de estúdio: dá coesão sem precisar de contraste entre duas sans genéricas.
 *
 * IBM Plex Mono marca só o que é dado: numeração do processo, valores do
 * painel, fontes das estatísticas, campos do formulário. Monoespaçada é o
 * vernáculo de quem trabalha com sistema — aqui ela diz "isto é medida",
 * não "isto é enfeite".
 *
 * Só o subset latin: o português (á, ç, ã, õ, ê…) está inteiro nele, e o
 * subset estendido dobrava o número de arquivos baixados. Só o Archivo é
 * pré-carregado, porque é ele que desenha o H1 (o maior elemento da dobra);
 * a mono entra com swap.
 *
 * O Inter é do CRM; a assinatura HGA continua em Exo 2.
 */

export const archivo = Archivo({
  subsets: ['latin'],
  // corpo 400, rótulos e botões 500, títulos 600 — 700 não é usado
  weight: ['400', '500', '600'],
  variable: '--font-hga-sans',
  display: 'swap',
})

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-hga-mono',
  display: 'swap',
  preload: false,
})
