import { CheckCircle2, Clock, Filter, LayoutGrid, Send } from 'lucide-react'

/**
 * Composição do hero: a interface de uma automação em execução.
 * É software, não enfeite — mostra o tipo de coisa que a HGA entrega.
 * Server Component: o movimento é só CSS (uma etapa em execução pulsa).
 */

const steps = [
  { icon: LayoutGrid, label: 'Formulário do site', meta: 'Origem do lead', state: 'done' as const },
  { icon: CheckCircle2, label: 'Cadastro no CRM', meta: 'Contato e empresa', state: 'done' as const },
  { icon: Filter, label: 'Triagem por IA', meta: 'Classificação e prioridade', state: 'running' as const },
  { icon: Send, label: 'Follow-up agendado', meta: 'Responsável definido', state: 'queued' as const },
]

const stateLabel = {
  done: 'concluído',
  running: 'em execução',
  queued: 'na fila',
}

export function HeroPanel() {
  return (
    <div className="hga-panel" aria-label="Exemplo de fluxo automatizado: do formulário ao follow-up">
      <div className="hga-panel-bar">
        <span className="hga-panel-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="hga-panel-title">Fluxo · Novo lead</span>
        <span className="hga-panel-status">
          <span className="hga-panel-status-dot" aria-hidden="true" />
          Ativo
        </span>
      </div>

      <ol className="hga-panel-steps">
        {steps.map(({ icon: Icon, label, meta, state }) => (
          <li className="hga-panel-step" data-state={state} key={label}>
            <span className="hga-panel-step-icon" aria-hidden="true">
              <Icon size={15} />
            </span>
            <span className="hga-panel-step-text">
              <span className="hga-panel-step-label">{label}</span>
              <span className="hga-panel-step-meta">{meta}</span>
            </span>
            <span className="hga-panel-step-state">{stateLabel[state]}</span>
          </li>
        ))}
      </ol>

      <div className="hga-panel-foot">
        <Clock size={13} aria-hidden="true" />
        <span>Cada etapa fica registrada — dá para auditar o que rodou e quando.</span>
      </div>
    </div>
  )
}
