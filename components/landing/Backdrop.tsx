/**
 * Camada de fundo da landing — puramente decorativa (aria-hidden).
 *
 * São quatro planos empilhados, todos atrás do conteúdo:
 *  1. malha (grid) com máscara radial, some antes de virar textura poluída
 *  2. dois halos frios que derivam devagar (azul e violeta da mesma família)
 *  3. um "sweep" horizontal muito fraco no topo, dá a sensação de luz viva
 *  4. grão fino, tira o aspecto chapado dos degradês
 *
 * Nada aqui responde a scroll ou ponteiro: é só CSS, sem custo de JS.
 */
export function Backdrop() {
  return (
    <div className="hga-backdrop" aria-hidden="true">
      <div className="hga-backdrop-grid" />
      <div className="hga-backdrop-orb hga-backdrop-orb-a" />
      <div className="hga-backdrop-orb hga-backdrop-orb-b" />
      <div className="hga-backdrop-sweep" />
      <div className="hga-backdrop-noise" />
    </div>
  )
}
