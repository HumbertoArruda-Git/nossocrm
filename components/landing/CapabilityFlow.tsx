import { ArrowDownToLine, Database, Sparkles, Workflow, Zap } from 'lucide-react'

const nodes = [
  { icon: ArrowDownToLine, label: 'Entrada', tag: 'origem do dado' },
  { icon: Database, label: 'Dados', tag: 'integração' },
  { icon: Workflow, label: 'Automação', tag: 'execução' },
  { icon: Sparkles, label: 'Inteligência', tag: 'decisão' },
  { icon: Zap, label: 'Ação', tag: 'resultado' },
]

export function CapabilityFlow() {
  return (
    <div className="hga-flow" aria-hidden="true">
      <span className="hga-flow-rail" />
      {nodes.map((node, index) => (
        <div className="hga-flow-item" key={node.label}>
          {index > 0 && (
            <span className="hga-flow-connector">
              <span className="hga-flow-signal" />
            </span>
          )}
          <div className="hga-flow-node">
            <node.icon size={16} aria-hidden="true" />
            <span className="hga-flow-label">{node.label}</span>
            <span className="hga-flow-tag">{node.tag}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
