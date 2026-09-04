import { ImageResponse } from 'next/og'
import { getSolutionBySlug } from '@/lib/content/solutions'

/**
 * Imagem de compartilhamento (Open Graph / Twitter) da landing pública.
 *
 * É uma Route Handler e não um arquivo `opengraph-image` no segmento raiz de
 * propósito: metadados baseados em arquivo são herdados por todas as rotas
 * filhas, e a imagem da HGA acabaria colada também nas páginas internas do
 * CRM. Aqui o alcance é exatamente quem referencia esta URL.
 *
 * O desenho repete a assinatura do site — tinta azul-escura, a luz nascendo
 * de baixo e o horizonte de 1px cortando o borrão.
 */

const WIDTH = 1200
const HEIGHT = 630

const INK = '#04060C'
const PAPER = '#E9EDF7'
const MUTED = 'rgba(233, 237, 247, 0.62)'

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')
  // Só slugs conhecidos entram no desenho — o texto nunca vem cru da query.
  const solution = slug ? getSolutionBySlug(slug) : null

  const eyebrow = solution ? solution.category.toUpperCase() : 'AUTOMAÇÃO · CRM · INTEGRAÇÕES · DADOS'
  const title = solution
    ? solution.title
    : 'Automação, CRM e integrações sob medida para a sua operação.'
  const lead = solution
    ? solution.description
    : 'A HGA desenha e constrói o software que organiza o processo e coloca o dado onde a decisão acontece.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          background: INK,
          padding: '68px 76px',
        }}
      >
        {/*
          A luz é um gradiente LINEAR de baixo para cima, sangrando nas duas
          laterais. O radial da página renderiza com a borda da caixa visível
          no Satori — aqui o degradê termina transparente no próprio topo e
          não encosta em nenhuma aresta, então não sobra emenda.
        */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 400,
            backgroundImage:
              'linear-gradient(to top, rgba(120,168,255,0.40), rgba(47,107,255,0.20) 38%, rgba(19,51,168,0.08) 66%, rgba(4,6,12,0) 100%)',
          }}
        />
        {/* o horizonte: o mesmo corte de 1px que a página usa, aqui como
            base luminosa do cartão */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            backgroundImage:
              'linear-gradient(90deg, rgba(168,200,255,0), rgba(168,200,255,0.85) 28%, rgba(168,200,255,0.85) 72%, rgba(168,200,255,0))',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: PAPER, letterSpacing: 2 }}>
            HGA
          </div>
          <div style={{ display: 'flex', fontSize: 15, color: MUTED, letterSpacing: 6 }}>SYSTEMS</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
            <div style={{ display: 'flex', width: 38, height: 2, background: '#2F6BFF' }} />
            <div style={{ display: 'flex', fontSize: 17, color: MUTED, letterSpacing: 3 }}>{eyebrow}</div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1.6,
              color: PAPER,
              maxWidth: 940,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 26,
              fontSize: 24,
              lineHeight: 1.45,
              color: MUTED,
              maxWidth: 820,
            }}
          >
            {lead}
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  )
}
