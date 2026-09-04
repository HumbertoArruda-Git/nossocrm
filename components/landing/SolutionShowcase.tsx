import type { SolutionVisual as VisualKey } from '@/lib/content/solutions'

/**
 * A peça grande da página de solução.
 *
 * Não é a miniatura do cartão ampliada: é outra interface, com o espaço que
 * a página de dentro tem e a miniatura não tinha. Onde o cartão da home dá
 * o gesto ("isto é um funil"), aqui cabe o detalhe — contadores, estados,
 * rótulos de campo, eixos — e mais de um movimento acontecendo junto.
 *
 * O compasso longo continua sendo 5.6s, o mesmo das miniaturas, então as
 * duas peças conversam quando o visitante volta para a home.
 *
 * Tudo em SVG e CSS: segue sendo server component, sem JS no cliente.
 * Em telas pequenas o CSS esconde o texto fino (.hs-meta) e amplia os
 * rótulos essenciais — a composição vira leitura de textura, não de dado.
 */

/** Barra de janela comum a todas as peças. */
function Chrome({ title, status }: { title: string; status: string }) {
  return (
    <>
      <rect x="0" y="0" width="720" height="42" className="hs-chrome" />
      <circle cx="20" cy="21" r="4" className="hs-dot" />
      <circle cx="34" cy="21" r="4" className="hs-dot" />
      <circle cx="48" cy="21" r="4" className="hs-dot" />
      <text x="68" y="26" className="hs-title">{title}</text>
      <rect x="592" y="11" width="112" height="22" rx="11" className="hs-chip-ok" />
      <circle cx="606" cy="22" r="3.5" className="hs-dot-ok" />
      <text x="616" y="26" className="hs-num hs-num-ok">{status}</text>
      <path d="M0 42 H720" className="hs-rule" />
    </>
  )
}

function Automacao() {
  const rows = [
    { y: 62, label: 'Pedido recebido', meta: 'WhatsApp comercial', state: 'ok' },
    { y: 130, label: 'Cliente localizado no CRM', meta: 'CNPJ conferido', state: 'ok' },
    { y: 198, label: 'Lançamento no ERP', meta: 'Sem digitação manual', state: 'run' },
    { y: 266, label: 'Confirmação enviada', meta: 'Com prazo de entrega', state: 'wait' },
  ]
  return (
    <svg viewBox="0 0 720 400" role="img" aria-label="Fluxo automatizado do pedido: recebimento, localização do cliente, lançamento no ERP e confirmação">
      <Chrome title="FLUXO DE NOVO PEDIDO" status="ATIVO" />

      {/* coluna do gatilho */}
      <rect x="24" y="62" width="170" height="86" rx="10" className="hv-surface" />
      <text x="40" y="88" className="hs-num">GATILHO</text>
      <text x="40" y="112" className="hs-label">Mensagem nova</text>
      <text x="40" y="132" className="hs-meta">a cada 30 segundos</text>

      <rect x="24" y="164" width="170" height="86" rx="10" className="hv-surface" />
      <text x="40" y="190" className="hs-num">EXECUÇÕES HOJE</text>
      <text x="40" y="228" className="hs-big hv-swap-a">128</text>
      <text x="40" y="228" className="hs-big hv-swap-b">129</text>

      {/* espinha e derivações */}
      <path d="M194 105 H222" className="hv-conn hv-flow" />
      <path d="M222 90 V294" className="hv-conn hv-flow" />
      {rows.map((row) => (
        <path key={row.y} d={`M222 ${row.y + 28} H236`} className="hv-conn hv-flow" />
      ))}

      {rows.map(({ y, label, meta, state }) => (
        <g key={label}>
          <rect x="236" y={y} width="460" height="56" rx="10" className={state === 'run' ? 'hs-row-live' : 'hv-surface'} />
          <rect x="252" y={y + 14} width="28" height="28" rx="8" className={state === 'run' ? 'hs-icon-live' : 'hv-surface-2'} />
          <text x="296" y={y + 26} className="hs-label">{label}</text>
          <text x="296" y={y + 45} className="hs-meta">{meta}</text>
          {state === 'ok' && <circle cx="668" cy={y + 28} r="7" className="hv-ok" />}
          {state === 'run' && <circle cx="668" cy={y + 28} r="7" className="hv-hub hv-throb" />}
          {state === 'wait' && <circle cx="668" cy={y + 28} r="7" className="hv-pending" />}
          <text x="560" y={y + 33} textAnchor="end" className={`hs-num${state === 'run' ? ' hs-num-accent' : ''}`}>
            {state === 'ok' ? 'CONCLUÍDO' : state === 'run' ? 'RODANDO' : 'NA FILA'}
          </text>
        </g>
      ))}

      <text x="24" y="345" className="hs-num hv-swap-a">3 DE 4 ETAPAS</text>
      <text x="24" y="345" className="hs-num hs-num-accent hv-swap-b">4 DE 4 ETAPAS</text>
      <text x="696" y="345" textAnchor="end" className="hs-num">TEMPO MÉDIO 4,2 S</text>
      <rect x="24" y="360" width="672" height="4" rx="2" className="hv-pending" />
      <rect x="24" y="360" width="672" height="4" rx="2" className="hv-accent hv-meter" />
    </svg>
  )
}

function Crm() {
  const cols = [
    { x: 24, label: 'QUALIFICAÇÃO', counts: ['12', '11'], cards: [90, 152, 214] },
    { x: 248, label: 'PROPOSTA', counts: ['8', '9'], cards: [90, 152] },
    { x: 472, label: 'FECHAMENTO', counts: ['5', '5'], cards: [90] },
  ]
  return (
    <svg viewBox="0 0 720 400" role="img" aria-label="Funil comercial em três etapas com oportunidades avançando entre elas">
      <Chrome title="FUNIL COMERCIAL" status="AO VIVO" />

      {cols.map((col, i) => (
        <g key={col.x}>
          <rect x={col.x} y="62" width="34" height="4" rx="2" className={i === 0 ? 'hv-accent' : 'hv-soft'} />
          <text x={col.x} y="84" className="hs-num">{col.label}</text>
          <text x={col.x + 224} y="84" textAnchor="end" className="hs-num hs-num-accent hv-swap-a">{col.counts[0]}</text>
          <text x={col.x + 224} y="84" textAnchor="end" className="hs-num hs-num-accent hv-swap-b">{col.counts[1]}</text>

          {col.cards.map((y, j) => (
            <g key={y} className={i === 0 && j === 2 ? 'hs-advance' : undefined}>
              <rect x={col.x} y={y} width="224" height="50" rx="9" className="hv-surface" />
              <circle cx={col.x + 22} cy={y + 25} r="9" className="hv-surface-2" />
              <rect x={col.x + 40} y={y + 15} width="96" height="6" rx="3" className="hv-line" />
              <rect x={col.x + 40} y={y + 29} width="60" height="5" rx="2.5" className="hv-soft" />
              <rect x={col.x + 164} y={y + 21} width="44" height="7" rx="3.5" className="hv-soft" />
            </g>
          ))}
        </g>
      ))}

      {/* rodapé com o total e a taxa */}
      <path d="M24 296 H696" className="hs-rule" />
      <text x="24" y="326" className="hs-num">TOTAL EM ABERTO</text>
      <text x="24" y="362" className="hs-big">25 oportunidades</text>
      <text x="696" y="326" textAnchor="end" className="hs-num">CONVERSÃO</text>
      <text x="696" y="362" textAnchor="end" className="hs-big hv-swap-a">31%</text>
      <text x="696" y="362" textAnchor="end" className="hs-big hs-big-accent hv-swap-b">34%</text>
    </svg>
  )
}

function Ia() {
  const msgs = [
    { y: 62, label: 'Cobrança de prazo', meta: 'há 2 minutos' },
    { y: 132, label: 'Dúvida sobre nota', meta: 'há 8 minutos' },
    { y: 202, label: 'Pedido de orçamento', meta: 'há 15 minutos' },
  ]
  return (
    <svg viewBox="0 0 720 400" role="img" aria-label="Triagem de mensagens por IA: classificação, prioridade e rascunho de resposta">
      <Chrome title="TRIAGEM DE ATENDIMENTO" status="ATIVO" />

      <text x="24" y="60" className="hs-num">ENTRADA</text>
      {msgs.map(({ y, label, meta }) => (
        <g key={label}>
          <rect x="24" y={y + 12} width="270" height="58" rx="9" className="hv-surface" />
          <text x="48" y={y + 38} className="hs-label">{label}</text>
          <text x="48" y={y + 57} className="hs-meta">{meta}</text>
        </g>
      ))}
      {/* a seleção percorre a fila */}
      <rect x="24" y="74" width="4" height="58" rx="2" className="hv-accent hs-select" />

      <text x="320" y="60" className="hs-num">CLASSIFICAÇÃO</text>
      <g className="hv-pop">
        <rect x="320" y="74" width="118" height="30" rx="15" className="hv-tag" />
        <text x="340" y="94" className="hs-num hs-num-accent">SUPORTE</text>
        <rect x="450" y="74" width="86" height="30" rx="15" className="hv-tag" />
        <text x="470" y="94" className="hs-num hs-num-accent">ALTA</text>
      </g>

      <text x="320" y="140" className="hs-num">CONFIANÇA</text>
      <rect x="320" y="152" width="376" height="8" rx="4" className="hv-pending" />
      <rect x="320" y="152" width="376" height="8" rx="4" className="hv-accent hv-meter" />
      <text x="696" y="140" textAnchor="end" className="hs-num hv-swap-a">0,82</text>
      <text x="696" y="140" textAnchor="end" className="hs-num hs-num-accent hv-swap-b">0,94</text>

      <rect x="320" y="186" width="376" height="140" rx="10" className="hv-surface-2" />
      <text x="344" y="214" className="hs-num">RASCUNHO SUGERIDO</text>
      <rect x="344" y="232" width="328" height="7" rx="3.5" className="hv-soft hv-type" />
      <rect x="344" y="252" width="300" height="7" rx="3.5" className="hv-soft hv-type hv-type-2" />
      <rect x="344" y="272" width="196" height="7" rx="3.5" className="hv-soft hv-type hv-type-3" />
      <rect x="344" y="296" width="120" height="18" rx="9" className="hv-tag" />
      <text x="358" y="309" className="hs-num hs-num-accent">REVISAR</text>

      <text x="24" y="368" className="hs-num">A DECISÃO FINAL CONTINUA SENDO DO TIME</text>
    </svg>
  )
}

function Integracao() {
  const sources = [
    { y: 70, label: 'CRM' },
    { y: 132, label: 'ERP' },
    { y: 194, label: 'WhatsApp' },
    { y: 256, label: 'Planilhas' },
  ]
  const targets = [
    { y: 100, label: 'API interna' },
    { y: 168, label: 'Painel' },
    { y: 236, label: 'Webhook' },
  ]
  return (
    <svg viewBox="0 0 720 400" role="img" aria-label="Barramento de integração ligando CRM, ERP, WhatsApp e planilhas a API, painel e webhook">
      <Chrome title="BARRAMENTO DE INTEGRAÇÃO" status="SINCRONIZANDO" />

      <text x="24" y="60" className="hs-num">ORIGENS</text>
      {sources.map(({ y, label }, i) => (
        <g key={label}>
          <rect x="24" y={y} width="156" height="48" rx="10" className="hv-surface" />
          <circle cx="46" cy={y + 24} r="6" className="hv-soft" />
          <text x="62" y={y + 29} className="hs-label">{label}</text>
          <path d={`M180 ${y + 24} H262`} className="hv-conn hv-flow" style={{ animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}

      <path d="M262 94 V190" className="hv-conn hv-flow" />
      <path d="M262 280 V190" className="hv-conn hv-flow" />

      <rect x="262" y="140" width="150" height="112" rx="16" className="hv-hub hv-throb" />
      <text x="337" y="176" textAnchor="middle" className="hs-num hs-num-accent">BARRAMENTO</text>
      <text x="337" y="212" textAnchor="middle" className="hs-big hs-big-accent hv-swap-a">4</text>
      <text x="337" y="212" textAnchor="middle" className="hs-big hs-big-accent hv-swap-b">5</text>
      <text x="337" y="234" textAnchor="middle" className="hs-meta">fluxos ativos</text>

      {targets.map(({ y, label }, i) => (
        <g key={label}>
          <path d={`M412 196 H520 V${y + 24} H540`} className="hv-conn hv-flow" style={{ animationDelay: `${i * 0.25}s` }} />
          <rect x="540" y={y} width="156" height="48" rx="10" className="hv-surface" />
          <text x="562" y={y + 29} className="hs-label">{label}</text>
        </g>
      ))}
      <text x="540" y="60" className="hs-num">DESTINOS</text>

      <path d="M24 320 H696" className="hs-rule" />
      <text x="24" y="352" className="hs-num">ÚLTIMA SINCRONIZAÇÃO</text>
      <text x="696" y="352" textAnchor="end" className="hs-num hs-num-accent hv-swap-a">HÁ 12 S</text>
      <text x="696" y="352" textAnchor="end" className="hs-num hs-num-accent hv-swap-b">AGORA</text>
    </svg>
  )
}

function Dashboards() {
  const bars = [
    { x: 60, h: 52, d: 'SEG' },
    { x: 128, h: 84, d: 'TER' },
    { x: 196, h: 66, d: 'QUA' },
    { x: 264, h: 112, d: 'QUI' },
    { x: 332, h: 94, d: 'SEX' },
    { x: 400, h: 132, d: 'SÁB' },
    { x: 468, h: 78, d: 'DOM' },
  ]
  const kpis = [
    { x: 24, label: 'EM ABERTO', a: '142', b: '138' },
    { x: 256, label: 'RESOLVIDOS HOJE', a: '37', b: '41' },
    { x: 488, label: 'TEMPO MÉDIO', a: '3,4 H', b: '3,1 H' },
  ]
  return (
    <svg viewBox="0 0 720 400" role="img" aria-label="Painel operacional com indicadores, série por dia da semana e tendência">
      <Chrome title="PAINEL OPERACIONAL" status="ATUALIZADO" />

      {kpis.map(({ x, label, a, b }) => (
        <g key={label}>
          <rect x={x} y="60" width="208" height="92" rx="10" className="hv-surface" />
          <text x={x + 20} y="86" className="hs-num">{label}</text>
          <text x={x + 20} y="124" className="hs-big hv-swap-a">{a}</text>
          <text x={x + 20} y="124" className="hs-big hs-big-accent hv-swap-b">{b}</text>
          <rect x={x + 20} y="134" width="168" height="5" rx="2.5" className="hv-pending" />
          <rect x={x + 20} y="134" width="168" height="5" rx="2.5" className="hv-accent hv-meter" />
        </g>
      ))}

      <rect x="24" y="168" width="672" height="204" rx="12" className="hv-surface" />
      <text x="48" y="196" className="hs-num">CHAMADOS POR DIA</text>
      <text x="672" y="196" textAnchor="end" className="hs-num hs-num-accent">TENDÊNCIA 7 DIAS</text>

      <path d="M48 330 H672" className="hv-axis" />
      {bars.map(({ x, h, d }, i) => (
        <g key={d}>
          <rect
            x={x}
            y={330 - h}
            width="34"
            height={h}
            rx="5"
            className={`${i === bars.length - 2 ? 'hv-accent' : 'hv-soft'} hv-bar`}
            style={{ animationDelay: `${i * 0.24}s` }}
          />
          <text x={x + 17} y="352" textAnchor="middle" className="hs-num">{d}</text>
        </g>
      ))}
      <path
        d="M77 268 L145 240 L213 254 L281 216 L349 232 L417 200 L485 244"
        className="hv-spark"
        pathLength={1}
      />
    </svg>
  )
}

function Sistemas() {
  const nav = [
    { y: 88, label: 'Pedidos', active: true },
    { y: 128, label: 'Clientes' },
    { y: 168, label: 'Estoque' },
    { y: 208, label: 'Relatórios' },
  ]
  const rows = [
    { y: 132, id: '#4182', w: 168, state: 'ok', label: 'Faturado' },
    { y: 190, id: '#4183', w: 210, state: 'run', label: 'Em separação' },
    { y: 248, id: '#4184', w: 140, state: 'wait', label: 'Aguardando' },
    { y: 306, id: '#4185', w: 190, state: 'wait', label: 'Aguardando' },
  ]
  return (
    <svg viewBox="0 0 720 400" role="img" aria-label="Aplicação interna com navegação lateral e lista de pedidos por estado">
      <Chrome title="PAINEL INTERNO" status="CONECTADO" />

      <rect x="0" y="42" width="164" height="358" className="hv-panel" />
      <path d="M164 42 V400" className="hs-rule" />
      <text x="24" y="70" className="hs-num">MÓDULOS</text>
      {nav.map(({ y, label, active }) => (
        <g key={label}>
          {active && <rect x="14" y={y - 18} width="136" height="30" rx="7" className="hv-tag" />}
          <text x="28" y={y} className={active ? 'hs-label hs-label-accent' : 'hs-label hs-label-dim'}>{label}</text>
        </g>
      ))}
      <rect x="14" y="252" width="136" height="34" rx="8" className="hv-hub hv-throb" />
      <text x="82" y="274" textAnchor="middle" className="hs-num hs-num-accent">NOVO PEDIDO</text>

      <text x="192" y="76" className="hs-num">PEDIDOS DA SEMANA</text>
      <text x="696" y="76" textAnchor="end" className="hs-num hv-swap-a">18 REGISTROS</text>
      <text x="696" y="76" textAnchor="end" className="hs-num hs-num-accent hv-swap-b">19 REGISTROS</text>
      <path d="M192 96 H696" className="hs-rule" />

      {rows.map(({ y, id, w, state, label }) => (
        <g key={id}>
          <rect x="192" y={y - 22} width="504" height="44" rx="8" className="hv-surface" />
          <text x="212" y={y + 5} className="hs-num">{id}</text>
          <rect x="276" y={y - 4} width={w} height="7" rx="3.5" className="hv-line" />
          <rect x="560" y={y - 14} width="120" height="28" rx="14" className={state === 'ok' ? 'hv-ok' : state === 'run' ? 'hv-tag' : 'hv-pending'} />
          <text x="620" y={y + 5} textAnchor="middle" className={`hs-num${state === 'run' ? ' hs-num-accent' : ''}`}>{label}</text>
        </g>
      ))}
      {/* a seleção desce pela lista */}
      <rect x="192" y="110" width="4" height="44" rx="2" className="hv-accent hs-select-row" />
    </svg>
  )
}

const map: Record<VisualKey, () => React.ReactElement> = {
  automacao: Automacao,
  crm: Crm,
  ia: Ia,
  integracao: Integracao,
  dashboards: Dashboards,
  sistemas: Sistemas,
}

export function SolutionShowcase({ name }: { name: VisualKey }) {
  const Visual = map[name]
  if (!Visual) return null
  return (
    <div className="hga-solution-showcase">
      <Visual />
    </div>
  )
}
