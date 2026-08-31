export function HeroFragments() {
  return (
    <div className="hga-hero-fragments" aria-hidden="true">
      <div className="hga-fragment hga-fragment-pipeline">
        <div className="hga-fragment-row">
          <span className="hga-fragment-label">Empresa Exemplo</span>
          <span className="hga-fragment-tag">Etapa 2</span>
        </div>
        <div className="hga-fragment-row">
          <span className="hga-fragment-sublabel">Em análise</span>
        </div>
        <div className="hga-fragment-bar">
          <span style={{ width: '58%' }} />
        </div>
      </div>

      <div className="hga-fragment hga-fragment-status">
        <div className="hga-fragment-row">
          <span className="hga-fragment-pulse" />
          <span className="hga-fragment-label">Automação ativa</span>
        </div>
        <span className="hga-fragment-sublabel">3 fluxos conectados</span>
      </div>

      <div className="hga-fragment hga-fragment-activity">
        <span className="hga-fragment-sublabel">Atividade recente</span>
        <div className="hga-fragment-sparkline">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
