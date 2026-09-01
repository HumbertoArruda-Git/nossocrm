export interface Solution {
  slug: string
  category: string
  title: string
  description: string
  metaDescription: string
  includes: string[]
  audience: string
}

export const solutions: Solution[] = [
  {
    slug: 'automacao-de-processos',
    category: 'AUTOMAÇÃO',
    title: 'Automação de Processos',
    description:
      'Processos repetitivos ocupam tempo que poderia estar em decisões estratégicas. Mapeamos e automatizamos essas rotinas, liberando a equipe para o trabalho que realmente exige atenção humana.',
    metaDescription:
      'Automação de processos para eliminar tarefas manuais e repetitivas, com foco em reduzir erro operacional e liberar tempo da equipe.',
    includes: [
      'Mapeamento dos processos manuais que mais consomem tempo da equipe',
      'Automação de tarefas repetitivas: planilhas, formulários, notificações e rotinas administrativas',
      'Conexão entre as etapas do processo, sem depender de alguém copiar dados de um lugar para outro',
      'Redução de erro humano em tarefas puramente operacionais',
    ],
    audience:
      'Equipes que perdem tempo com tarefas repetitivas e processos que hoje só funcionam porque alguém lembra de fazer manualmente.',
  },
  {
    slug: 'crm-e-gestao-comercial',
    category: 'CRM / SISTEMAS',
    title: 'CRM e Gestão Comercial',
    description:
      'Sem um lugar único para acompanhar oportunidades, informações comerciais se perdem entre conversas e planilhas. Um CRM bem estruturado organiza esse fluxo e deixa claro qual é o próximo passo de cada negociação.',
    metaDescription:
      'Implantação de CRM e organização do funil comercial, com histórico de oportunidades e indicadores claros para o time de vendas.',
    includes: [
      'Funil de vendas organizado por etapas, com visão clara de onde cada negociação está',
      'Histórico de interações por lead, sem depender da memória de quem atendeu',
      'Indicadores comerciais em tempo real para acompanhar o desempenho do time',
      'Integração com os canais de atendimento que a empresa já usa',
    ],
    audience:
      'Times comerciais que hoje dependem de planilhas soltas ou da memória de cada vendedor para acompanhar oportunidades.',
  },
  {
    slug: 'inteligencia-artificial-aplicada',
    category: 'IA APLICADA',
    title: 'Inteligência Artificial Aplicada',
    description:
      'Nem toda etapa comercial precisa esperar disponibilidade humana. Aplicamos IA nos pontos certos do processo — triagem, resposta inicial, apoio à análise — para tornar a operação mais ágil sem perder controle.',
    metaDescription:
      'IA aplicada a pontos específicos da operação comercial — triagem, primeira resposta e apoio à análise — com decisão humana preservada.',
    includes: [
      'Triagem automática de leads, priorizando quem tem mais chance de conversão',
      'Respostas iniciais assistidas por IA, sem deixar o contato esperando',
      'Apoio à análise e priorização de oportunidades para o time comercial',
      'IA aplicada apenas onde existe decisão real — não IA de vitrine',
    ],
    audience:
      'Operações com alto volume de contatos que precisam de agilidade no primeiro atendimento sem perder controle do processo.',
  },
  {
    slug: 'sistemas-sob-medida',
    category: 'SOFTWARE',
    title: 'Sistemas Sob Medida',
    description:
      'Ferramentas genéricas nem sempre acompanham a forma como o negócio realmente funciona. Construímos sistemas desenhados para o seu fluxo específico, em vez de adaptar o negócio a um software pronto.',
    metaDescription:
      'Desenvolvimento de sistemas sob medida, desenhados a partir do processo real da empresa em vez de adaptar o negócio a uma ferramenta pronta.',
    includes: [
      'Levantamento do fluxo real da operação, não de um modelo genérico de mercado',
      'Desenvolvimento de sistema próprio, construído para o seu processo específico',
      'Evolução contínua do sistema conforme o negócio cresce e muda',
      'Decisões técnicas orientadas pelo contexto do negócio, não pelo que é mais fácil de vender',
    ],
    audience:
      'Empresas cujo processo não cabe em uma ferramenta pronta de mercado, ou que já tentaram adaptar um software genérico sem sucesso.',
  },
  {
    slug: 'integracao-entre-ferramentas',
    category: 'INTEGRAÇÕES',
    title: 'Integração entre Ferramentas',
    description:
      'Sistemas que não conversam entre si geram retrabalho e dados desencontrados. Conectamos as ferramentas que sua empresa já usa para que a informação circule automaticamente entre elas.',
    metaDescription:
      'Integração entre sistemas já usados pela empresa, eliminando retrabalho manual e mantendo os dados sincronizados entre ferramentas.',
    includes: [
      'Conexão entre os sistemas que a empresa já usa hoje, sem trocar de ferramenta',
      'Eliminação do retrabalho manual de copiar dados entre plataformas',
      'Sincronização automática de informações, reduzindo divergência entre sistemas',
      'Arquitetura pensada para crescer conforme novas ferramentas entram na operação',
    ],
    audience:
      'Empresas com várias ferramentas em uso que não conversam entre si, gerando retrabalho e informação desencontrada.',
  },
  {
    slug: 'sites-e-landing-pages',
    category: 'WEB',
    title: 'Sites e Landing Pages',
    description:
      'Uma presença digital confusa afasta quem já está interessado. Criamos sites e landing pages claros e diretos, pensados para transformar visita em oportunidade real.',
    metaDescription:
      'Sites e landing pages objetivos, com estrutura pensada para conversão, performance e SEO técnico desde o início do projeto.',
    includes: [
      'Design objetivo e direto ao ponto, sem elementos que distraem do objetivo da página',
      'Estrutura pensada para conversão, guiando o visitante até a ação desejada',
      'Performance real de carregamento, não apenas visual bonito',
      'SEO técnico já configurado desde o lançamento, sem pendência para depois',
    ],
    audience:
      'Empresas cuja presença digital hoje confunde o visitante ou simplesmente não gera oportunidades reais.',
  },
]

export function getSolutionBySlug(slug: string): Solution | undefined {
  return solutions.find((solution) => solution.slug === slug)
}
