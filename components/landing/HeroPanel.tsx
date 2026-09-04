'use client'

import { useEffect, useState } from 'react'
import { Building2, CheckCircle2, Clock, Filter, Flag, LayoutGrid, Send, UserRound } from 'lucide-react'

/**
 * O artefato do hero: uma automação rodando, não uma captura de tela parada.
 *
 * O ciclo é a promessa da HGA encenada em quatro tempos — o lead chega pelo
 * site, vira registro no CRM, passa pela triagem e sai com follow-up marcado.
 * À esquerda as etapas avançam; à direita o registro se preenche campo a
 * campo, no compasso de cada etapa concluída. Quando o ciclo fecha, ele
 * recomeça: é uma rotina, e rotina não tem fim.
 *
 * A animação é uma máquina de estados simples (um contador de quadros) em vez
 * de keyframes CSS espalhados — assim as duas colunas nunca saem de sincronia.
 */

const steps = [
  { icon: LayoutGrid, label: 'Formulário do site', meta: 'Origem do lead' },
  { icon: CheckCircle2, label: 'Cadastro no CRM', meta: 'Contato e empresa' },
  { icon: Filter, label: 'Triagem por IA', meta: 'Classificação e prioridade' },
  { icon: Send, label: 'Follow-up agendado', meta: 'Responsável definido' },
]

/** Um campo por etapa: o registro cresce no mesmo ritmo do fluxo. */
const record = [
  { icon: LayoutGrid, field: 'Origem', value: 'Formulário do site' },
  { icon: Building2, field: 'Empresa', value: 'Bandeirantes Log' },
  { icon: Flag, field: 'Prioridade', value: 'Alta', accent: true },
  { icon: UserRound, field: 'Responsável', value: 'Equipe comercial' },
]

const stateLabel = {
  done: 'concluído',
  running: 'em execução',
  queued: 'na fila',
} as const

/** 4 quadros de etapa + 2 de respiro antes de reiniciar. */
const FRAMES = steps.length + 2
const TICK_MS = 1700

export function HeroPanel() {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    // Sem movimento: mostra o ciclo já concluído — um estado final que faz
    // sentido sozinho, em vez de um começo vazio.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrame(steps.length)
      return
    }

    const id = window.setInterval(() => setFrame((f) => (f + 1) % FRAMES), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const completed = Math.min(frame, steps.length)

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
        <span
          className="hga-panel-progress"
          aria-hidden="true"
          style={{ '--hga-p': `${(completed / steps.length) * 100}%` } as React.CSSProperties}
        />
      </div>

      <div className="hga-panel-body">
        <ol className="hga-panel-steps">
          {steps.map(({ icon: Icon, label, meta }, index) => {
            const state = frame > index ? 'done' : frame === index ? 'running' : 'queued'
            return (
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
            )
          })}
        </ol>

        <div className="hga-panel-record">
          <p className="hga-panel-record-title">Registro</p>
          <ul className="hga-panel-record-list">
            {record.map(({ icon: Icon, field, value, accent }, index) => (
              <li className="hga-panel-record-row" data-filled={frame > index} key={field}>
                <span className="hga-panel-record-icon" aria-hidden="true">
                  <Icon size={13} />
                </span>
                <span className="hga-panel-record-field">{field}</span>
                <span className="hga-panel-record-value" data-accent={accent ? true : undefined}>
                  {value}
                </span>
                <span className="hga-panel-record-blank" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="hga-panel-foot">
        <Clock size={13} aria-hidden="true" />
        <span>Cada etapa fica registrada, dá para auditar o que rodou e quando.</span>
      </div>
    </div>
  )
}
