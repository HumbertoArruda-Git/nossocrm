'use client'

import { useId, useState } from 'react'
import { ArrowDownToLine, Database, Sparkles, Workflow, Zap } from 'lucide-react'

const nodes = [
  {
    icon: ArrowDownToLine,
    label: 'Entrada',
    tag: 'origem do dado',
    detail: 'Todo dado precisa entrar em algum lugar. Aqui capturamos a informação assim que ela surge — de um formulário, uma mensagem ou uma integração — sem depender de alguém digitar de novo depois.',
  },
  {
    icon: Database,
    label: 'Dados',
    tag: 'integração',
    detail: 'A informação capturada é organizada e disponibilizada onde ela é útil, conectando sistemas que hoje não conversam entre si.',
  },
  {
    icon: Workflow,
    label: 'Automação',
    tag: 'execução',
    detail: 'Rotinas que antes exigiam alguém acompanhar manualmente passam a rodar sozinhas, com a etapa certa disparando a próxima automaticamente.',
  },
  {
    icon: Sparkles,
    label: 'Inteligência',
    tag: 'decisão',
    detail: 'Onde existe uma decisão real a tomar — priorizar, responder, analisar — a IA entra para apoiar, sem tirar o controle do time.',
  },
  {
    icon: Zap,
    label: 'Ação',
    tag: 'resultado',
    detail: 'O ciclo termina em um resultado prático: um lead respondido, uma etapa avançada, uma informação disponível para quem decide.',
  },
]

export function CapabilityFlow() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const baseId = useId()

  return (
    <div className="hga-flow-wrap">
      <span className="hga-flow-rail" aria-hidden="true" />
      <ul className="hga-flow">
        {nodes.map((node, index) => {
          const isOpen = openIndex === index
          const buttonId = `${baseId}-flow-button-${index}`
          const panelId = `${baseId}-flow-panel-${index}`

          return (
            <li className="hga-flow-item" key={node.label}>
              {index > 0 && (
                <span className="hga-flow-connector" aria-hidden="true">
                  <span className="hga-flow-signal" />
                </span>
              )}
              <button
                type="button"
                id={buttonId}
                className="hga-flow-node"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <node.icon size={16} aria-hidden="true" />
                <span className="hga-flow-label">{node.label}</span>
                <span className="hga-flow-tag">{node.tag}</span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="hga-flow-panel"
                hidden={!isOpen}
              >
                <p>{node.detail}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
