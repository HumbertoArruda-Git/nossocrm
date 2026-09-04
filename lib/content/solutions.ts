export type SolutionVisual =
  | 'automacao'
  | 'crm'
  | 'ia'
  | 'integracao'
  | 'dashboards'
  | 'sistemas'

export interface Solution {
  slug: string
  category: string
  title: string
  shortTitle: string
  visual: SolutionVisual
  description: string
  metaDescription: string
  problem: string
  how: string
  examples: string[]
  benefits: string[]
  audience: string
}

export const solutions: Solution[] = [
  {
    slug: 'automacao-de-processos',
    category: 'Automação',
    title: 'Automação de Processos',
    shortTitle: 'Automação',
    visual: 'automacao',
    description:
      'Rotinas que hoje dependem de alguém lembrar de executar passam a rodar sozinhas, com registro de cada passo.',
    metaDescription:
      'Automação de processos: rotinas repetitivas, movimentação de dados, follow-ups e aprovações passam a rodar sem depender de execução manual.',
    problem:
      'Boa parte do dia da equipe vai em tarefas que se repetem: copiar dados de um sistema para outro, gerar o mesmo documento, lembrar de cobrar um retorno. Quando alguém falta ou esquece, o processo simplesmente para.',
    how:
      'Mapeamos o fluxo como ele acontece hoje, identificamos as etapas que não precisam de decisão humana e as automatizamos, conectando os sistemas que já estão em uso, com log de cada execução.',
    examples: [
      'Movimentação de dados entre sistemas',
      'Follow-up automático de prazos e tarefas',
      'Geração de documentos e propostas',
      'Notificações e fluxos de aprovação',
      'Rotinas administrativas recorrentes',
    ],
    benefits: [
      'Menos tempo em tarefas operacionais repetitivas',
      'Menos erro de digitação e de etapa esquecida',
      'O processo continua rodando sem depender de lembrete',
      'Histórico do que rodou, quando e com qual resultado',
    ],
    audience:
      'Equipes cujo processo só funciona porque alguém lembra de executá-lo manualmente.',
  },
  {
    slug: 'crm-gestao-comercial',
    category: 'CRM',
    title: 'CRM e Gestão Comercial',
    shortTitle: 'CRM',
    visual: 'crm',
    description:
      'Um lugar único para acompanhar oportunidades, com histórico por contato e o próximo passo sempre visível.',
    metaDescription:
      'CRM e gestão comercial: funil organizado por etapas, histórico de cada oportunidade e indicadores para acompanhar o desempenho do time.',
    problem:
      'Sem um lugar único, a informação comercial se espalha entre conversas de WhatsApp, planilhas e a memória de quem atendeu. Quando alguém sai de férias, o histórico sai junto.',
    how:
      'Estruturamos o funil nas etapas que o time realmente usa, com histórico por oportunidade, tarefas com responsável e prazo, e indicadores que mostram onde as negociações estão travando.',
    examples: [
      'Funil por etapas, com responsável e prazo',
      'Histórico de interações por contato',
      'Follow-ups que não dependem de memória',
      'Indicadores de conversão por etapa',
      'Integração com os canais de atendimento',
    ],
    benefits: [
      'Visão clara de onde cada negociação está',
      'Nada se perde entre um atendimento e outro',
      'Previsibilidade maior para o time comercial',
      'Menos tempo montando relatório manualmente',
    ],
    audience:
      'Times comerciais que hoje dependem de planilhas soltas ou da memória de cada vendedor.',
  },
  {
    slug: 'inteligencia-artificial',
    category: 'IA aplicada',
    title: 'Inteligência Artificial Aplicada',
    shortTitle: 'IA aplicada',
    visual: 'ia',
    description:
      'IA em pontos específicos da operação (triagem, primeira resposta, leitura de documento), com a decisão final no time.',
    metaDescription:
      'IA aplicada à operação: triagem de solicitações, primeira resposta, classificação e leitura de documentos, com decisão humana preservada.',
    problem:
      'Nem toda etapa precisa esperar alguém ficar livre. Por outro lado, aplicar IA sem critério gera respostas erradas em lugares onde errar é caro.',
    how:
      'Escolhemos com você as etapas em que a IA ajuda de fato (classificar, resumir, redigir um rascunho, extrair dados de um documento) e mantemos revisão humana onde a decisão tem peso.',
    examples: [
      'Triagem e classificação de solicitações',
      'Rascunho de primeira resposta ao cliente',
      'Extração de dados de documentos',
      'Resumo de histórico e de conversas longas',
      'Apoio à priorização de atendimento',
    ],
    benefits: [
      'Primeira resposta mais rápida',
      'Menos triagem manual repetitiva',
      'Menos tempo lendo histórico para se situar',
      'IA onde ela ajuda, não como vitrine',
    ],
    audience:
      'Operações com volume alto de mensagens, documentos ou solicitações para triar.',
  },
  {
    slug: 'integracao-de-sistemas',
    category: 'Integrações',
    title: 'Integração de Sistemas',
    shortTitle: 'Integrações',
    visual: 'integracao',
    description:
      'As ferramentas que a empresa já usa passam a trocar informação entre si, sem ninguém copiando dado no meio.',
    metaDescription:
      'Integração de sistemas: CRM, ERP, WhatsApp, formulários e bancos de dados trocando informação automaticamente, sem retrabalho manual.',
    problem:
      'Cada área adota a ferramenta que resolve o problema dela. O resultado é um conjunto de sistemas que não se falam, e alguém no meio copiando dado de um lado para o outro.',
    how:
      'Conectamos os sistemas por API, webhook ou banco, definindo qual é a fonte de verdade de cada informação e o que acontece quando os dados divergem.',
    examples: [
      'WhatsApp e e-mail ligados ao CRM',
      'CRM e ERP em sincronia',
      'Formulários alimentando o sistema direto',
      'APIs de terceiros e serviços externos',
      'Sincronização entre bases de dados',
    ],
    benefits: [
      'Fim do copia-e-cola entre sistemas',
      'Menos divergência entre bases',
      'Informação disponível onde a decisão acontece',
      'Base pronta para novas ferramentas entrarem',
    ],
    audience:
      'Empresas com várias ferramentas em uso que não conversam entre si.',
  },
  {
    slug: 'dashboards-bi',
    category: 'Dados',
    title: 'Dashboards e BI',
    shortTitle: 'Dashboards',
    visual: 'dashboards',
    description:
      'Os dados que já existem na operação reunidos em indicadores que respondem perguntas de decisão.',
    metaDescription:
      'Dashboards e BI: indicadores atualizados, visão consolidada entre áreas e alertas, a partir dos dados que a operação já gera.',
    problem:
      'O dado existe, mas está espalhado. Montar um número confiável exige exportar planilha, cruzar na mão e torcer para ninguém ter errado uma coluna.',
    how:
      'Definimos quais perguntas o painel precisa responder, consolidamos as fontes e montamos indicadores atualizados, com alertas quando algo sai da faixa esperada.',
    examples: [
      'Indicadores comerciais e operacionais',
      'Painéis por área e por responsável',
      'Alertas quando um número sai da faixa',
      'Consolidação de fontes diferentes',
      'Exportação para quem precisa do dado bruto',
    ],
    benefits: [
      'Indicador atualizado sem trabalho manual',
      'Mesma fonte de número para todo mundo',
      'Problema aparece antes de virar prejuízo',
      'Menos reunião para descobrir o que aconteceu',
    ],
    audience:
      'Empresas que já têm dados, mas não têm uma forma rápida e confiável de olhar para eles.',
  },
  {
    slug: 'sistemas-sob-medida',
    category: 'Software',
    title: 'Sistemas Sob Medida',
    shortTitle: 'Sob medida',
    visual: 'sistemas',
    description:
      'Quando o processo não cabe em ferramenta de prateleira, construímos o sistema em volta de como a operação funciona.',
    metaDescription:
      'Desenvolvimento de sistemas sob medida, desenhados a partir do processo real da empresa, com arquitetura preparada para evoluir.',
    problem:
      'Ferramenta pronta resolve o caso médio do mercado. Quando o processo tem uma particularidade que dá vantagem competitiva, adaptar o negócio ao software costuma custar mais caro que construir o certo.',
    how:
      'Levantamos o fluxo real, desenhamos o sistema em volta dele e entregamos em ciclos curtos, com a arquitetura preparada para mudar quando o negócio mudar.',
    examples: [
      'Aplicações web internas',
      'Portais para cliente ou parceiro',
      'Ferramentas de operação específicas',
      'Sistemas que ferramentas prontas não cobrem',
      'Evolução contínua depois da entrega',
    ],
    benefits: [
      'O sistema acompanha o processo, não o contrário',
      'Sem pagar por módulo que não se usa',
      'Arquitetura preparada para crescer',
      'Evolução contínua depois da entrega',
    ],
    audience:
      'Empresas cujo processo não cabe em uma ferramenta pronta de mercado.',
  },
]

export function getSolutionBySlug(slug: string): Solution | undefined {
  return solutions.find((solution) => solution.slug === slug)
}
