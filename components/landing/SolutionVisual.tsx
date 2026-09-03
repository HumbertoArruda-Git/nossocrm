import type { SolutionVisual as VisualKey } from '@/lib/content/solutions'

/**
 * Miniaturas de interface, uma por solução. São desenhos de software real
 * (fluxo, funil, triagem, integração, painel, aplicação) em SVG — sem imagem,
 * sem objeto 3D. Herdam cor do CSS via currentColor e das classes .hv-*.
 *
 * Os números/labels são CENOGRÁFICOS: contadores e estados de interface.
 * Nada aqui representa resultado, faturamento ou métrica real da HGA.
 * Em telas pequenas o CSS oculta as frases (.hv-num) e mantém apenas os rótulos
 * curtos (.hv-num-min), reescalados para continuarem nítidos no card 2 × 3.
 */

const box = 'hv-surface'
const line = 'hv-line'
const soft = 'hv-soft'
const accent = 'hv-accent'

function Automacao() {
  return (
    <svg viewBox="0 0 220 128" role="img" aria-label="Fluxo de automação: um gatilho encadeando três etapas, duas concluídas e uma na fila">
      <rect x="8" y="14" width="70" height="30" rx="7" className={box} />
      <circle cx="22" cy="29" r="4" className={accent} />
      <rect x="32" y="24" width="34" height="3.5" rx="1.75" className={line} />
      <rect x="32" y="32" width="22" height="3" rx="1.5" className={soft} />

      <path d="M78 29 H104" className="hv-conn" />
      <path d="M104 29 V60 H120" className="hv-conn" />
      <path d="M104 29 H120" className="hv-conn" />

      <rect x="120" y="14" width="88" height="30" rx="7" className={box} />
      <text x="126" y="27" className="hv-num hv-num-min">01</text>
      <rect x="146" y="23" width="30" height="3.5" rx="1.75" className={line} />
      <rect x="130" y="33" width="34" height="3" rx="1.5" className={soft} />
      <circle cx="198" cy="29" r="5" className="hv-ok" />

      <rect x="120" y="46" width="88" height="30" rx="7" className={box} />
      <text x="126" y="59" className="hv-num hv-num-min">02</text>
      <rect x="146" y="55" width="26" height="3.5" rx="1.75" className={line} />
      <rect x="130" y="65" width="40" height="3" rx="1.5" className={soft} />
      <circle cx="198" cy="61" r="5" className="hv-ok" />

      <path d="M104 60 V92 H120" className="hv-conn" />
      <rect x="120" y="78" width="88" height="30" rx="7" className={box} />
      <text x="126" y="91" className="hv-num hv-num-min">03</text>
      <rect x="146" y="87" width="22" height="3.5" rx="1.75" className={line} />
      <rect x="130" y="97" width="36" height="3" rx="1.5" className={soft} />
      <circle cx="198" cy="93" r="5" className="hv-pending" />

      <text x="8" y="120" className="hv-num">2 de 3 concluídas</text>
    </svg>
  )
}

function Crm() {
  const cols = [
    { x: 8, count: '12', cards: [22, 54, 86], h: [26, 26, 16] },
    { x: 80, count: '8', cards: [22, 54], h: [26, 22] },
    { x: 152, count: '5', cards: [22], h: [26] },
  ]
  return (
    <svg viewBox="0 0 220 128" role="img" aria-label="Funil comercial em três colunas com contagem de oportunidades em cada etapa">
      {cols.map((col, i) => (
        <g key={col.x}>
          <rect x={col.x} y={6} width={i === 0 ? 34 : 30} height="3.5" rx="1.75" className={i === 0 ? accent : soft} />
          <text x={col.x + 60} y={10} textAnchor="end" className="hv-num hv-num-min">{col.count}</text>
          {col.cards.map((y, j) => (
            <g key={y}>
              <rect x={col.x} y={y} width="60" height={col.h[j]} rx="6" className={box} />
              <rect x={col.x + 9} y={y + 8} width="30" height="3.5" rx="1.75" className={line} />
              <rect x={col.x + 9} y={y + 16} width="18" height="3" rx="1.5" className={soft} />
            </g>
          ))}
        </g>
      ))}
      <rect x="8" y="106" width="204" height="16" rx="6" className="hv-surface-2" />
      <text x="18" y="117" className="hv-num">25 oportunidades</text>
      <rect x="176" y="112" width="26" height="3.5" rx="1.75" className={accent} />
    </svg>
  )
}

function Ia() {
  return (
    <svg viewBox="0 0 220 128" role="img" aria-label="Mensagem recebida sendo classificada e respondida com rascunho">
      <rect x="8" y="10" width="132" height="36" rx="8" className={box} />
      <rect x="20" y="20" width="80" height="3.5" rx="1.75" className={line} />
      <rect x="20" y="28" width="104" height="3" rx="1.5" className={soft} />
      <rect x="20" y="35" width="62" height="3" rx="1.5" className={soft} />

      <rect x="8" y="54" width="96" height="18" rx="9" className="hv-tag" />
      <circle cx="21" cy="63" r="3.5" className={accent} />
      <text x="30" y="66" className="hv-num hv-num-accent">Suporte · alta</text>

      <rect x="72" y="82" width="140" height="38" rx="8" className="hv-surface-2" />
      <text x="84" y="95" className="hv-num">Rascunho</text>
      <rect x="84" y="101" width="112" height="3" rx="1.5" className={soft} />
      <rect x="84" y="108" width="72" height="3" rx="1.5" className={soft} />
    </svg>
  )
}

function Integracao() {
  const chips = [
    { x: 8, y: 10, label: 'CRM' },
    { x: 8, y: 52, label: 'ERP' },
    { x: 8, y: 94, label: 'Chat' },
  ]
  return (
    <svg viewBox="0 0 220 128" role="img" aria-label="CRM, ERP e chat conectados a um núcleo de integração com quatro fluxos ativos">
      {chips.map((c) => (
        <g key={c.y}>
          <rect x={c.x} y={c.y} width="62" height="24" rx="7" className={box} />
          <circle cx={c.x + 13} cy={c.y + 12} r="3.5" className={soft} />
          <text x={c.x + 23} y={c.y + 15} className="hv-num hv-num-min">{c.label}</text>
          <path d={`M70 ${c.y + 12} H108`} className="hv-conn" />
        </g>
      ))}
      <path d="M108 22 V64" className="hv-conn" />
      <path d="M108 106 V64" className="hv-conn" />

      <rect x="108" y="44" width="42" height="40" rx="10" className="hv-hub" />
      <text x="129" y="62" textAnchor="middle" className="hv-num hv-num-accent">sync</text>
      <text x="129" y="74" textAnchor="middle" className="hv-num hv-num-accent hv-num-min">4</text>

      <path d="M150 64 H176" className="hv-conn" />
      <rect x="176" y="50" width="36" height="28" rx="7" className={box} />
      <text x="185" y="67" className="hv-num hv-num-min">API</text>
    </svg>
  )
}

function Dashboards() {
  const bars = [
    { x: 22, h: 26, d: 'S' },
    { x: 46, h: 40, d: 'T' },
    { x: 70, h: 32, d: 'Q' },
    { x: 94, h: 54, d: 'Q' },
    { x: 118, h: 46, d: 'S' },
    { x: 142, h: 66, d: 'S' },
  ]
  return (
    <svg viewBox="0 0 220 128" role="img" aria-label="Painel com indicador, série temporal e barras por dia da semana">
      <rect x="8" y="8" width="96" height="30" rx="7" className="hv-surface-2" />
      <text x="18" y="20" className="hv-num">Em aberto</text>
      <rect x="18" y="25" width="44" height="6" rx="3" className={accent} />

      <rect x="112" y="8" width="100" height="30" rx="7" className="hv-surface-2" />
      <text x="122" y="20" className="hv-num">7 dias</text>
      <path d="M122 32 L138 27 L152 29 L168 20 L184 23 L202 16" className="hv-spark" />

      <rect x="8" y="46" width="204" height="74" rx="8" className={box} />
      <path d="M18 102 H202" className="hv-axis" />
      {bars.map((b, i) => (
        <g key={b.x}>
          <rect
            x={b.x}
            y={102 - b.h}
            width="12"
            height={b.h}
            rx="3"
            className={i === bars.length - 1 ? accent : soft}
          />
          <text x={b.x + 6} y={114} textAnchor="middle" className="hv-num hv-num-min">{b.d}</text>
        </g>
      ))}
      <text x="202" y="60" textAnchor="end" className="hv-num">por dia</text>
    </svg>
  )
}

function Sistemas() {
  return (
    <svg viewBox="0 0 220 128" role="img" aria-label="Aplicação com navegação lateral, lista de registros e ação principal">
      <rect x="8" y="8" width="204" height="112" rx="9" className={box} />
      <path d="M8 30 H212" className="hv-axis" />
      <circle cx="20" cy="19" r="3" className={soft} />
      <circle cx="30" cy="19" r="3" className={soft} />
      <circle cx="40" cy="19" r="3" className={soft} />
      <text x="54" y="22" className="hv-num">Painel interno</text>

      <rect x="8" y="30" width="54" height="90" className="hv-panel" />
      <rect x="18" y="42" width="32" height="3.5" rx="1.75" className={accent} />
      <text x="18" y="58" className="hv-num">Pedidos</text>
      <text x="18" y="70" className="hv-num">Clientes</text>
      <text x="18" y="82" className="hv-num">Relatórios</text>

      <text x="74" y="45" className="hv-num">Registros</text>
      <text x="200" y="45" textAnchor="end" className="hv-num hv-num-min">18</text>
      <rect x="74" y="56" width="126" height="20" rx="5" className="hv-surface-2" />
      <rect x="84" y="64" width="52" height="3.5" rx="1.75" className={soft} />
      <rect x="74" y="82" width="126" height="20" rx="5" className="hv-surface-2" />
      <rect x="84" y="90" width="70" height="3.5" rx="1.75" className={soft} />
      <rect x="160" y="106" width="40" height="6" rx="3" className={accent} />
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

export function SolutionVisual({ name, className }: { name: VisualKey; className?: string }) {
  const Visual = map[name]
  return <div className={`hga-visual ${className ?? ''}`}>{Visual ? <Visual /> : null}</div>
}
