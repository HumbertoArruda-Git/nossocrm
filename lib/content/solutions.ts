export type SolutionVisual =
  | 'automacao'
  | 'crm'
  | 'ia'
  | 'integracao'
  | 'dashboards'
  | 'sistemas'

export interface SolutionFaq {
  q: string
  a: string
}

/**
 * Conteúdo das páginas de solução.
 *
 * Regras de redação (a HGA ainda não tem cases publicados):
 * - nada de número de resultado, depoimento ou cliente — só como o trabalho
 *   é feito e o que é entregue;
 * - `scenario` é sempre apresentado como EXEMPLO ILUSTRATIVO na página;
 * - tecnologias citadas em `connects`/`how` são as que a HGA já opera
 *   (as mesmas do NossoCRM: Meta/Evolution/Z-API, OpenAI/Anthropic/Google,
 *   Next.js/PostgreSQL). Não acrescentar ferramenta sem confirmar.
 */
export interface Solution {
  slug: string
  category: string
  title: string
  shortTitle: string
  /** <title> da página, 50–60 caracteres, com a intenção de busca. */
  seoTitle: string
  visual: SolutionVisual
  description: string
  metaDescription: string
  /** Parágrafos. */
  problem: string[]
  /** Parágrafos. */
  how: string[]
  scenario: { title: string; before: string; after: string }
  deliverables: string[]
  connects: string[]
  examples: string[]
  benefits: string[]
  audience: string
  faq: SolutionFaq[]
}

export const solutions: Solution[] = [
  {
    slug: 'automacao-de-processos',
    category: 'Automação',
    title: 'Automação de Processos',
    shortTitle: 'Automação',
    seoTitle: 'Automação de Processos Empresariais sob Medida | HGA',
    visual: 'automacao',
    description:
      'Rotinas que hoje dependem de alguém lembrar de executar passam a rodar sozinhas, com registro de cada passo.',
    metaDescription:
      'Automação de processos sob medida: tarefas repetitivas, follow-ups, documentos e aprovações rodando sozinhos, com registro de cada execução.',
    problem: [
      'Boa parte do dia da equipe vai em tarefas que se repetem: copiar dados de um sistema para outro, gerar o mesmo documento toda semana, lembrar de cobrar um retorno. Nenhuma delas exige decisão, mas todas exigem que alguém se lembre de fazer.',
      'Quando essa pessoa falta, sai de férias ou simplesmente esquece, o processo para. E como não há registro do que foi feito, o problema só aparece quando o cliente reclama ou o prazo já passou.',
    ],
    how: [
      'O trabalho começa acompanhando o fluxo como ele acontece hoje, com quem executa. A partir disso separamos o que é decisão, que continua com a equipe, do que é repetição e pode rodar sozinho.',
      'As etapas repetitivas viram automações conectadas aos sistemas que a empresa já usa. Cada execução fica registrada: o que rodou, quando, com quais dados e se deu certo. Quando algo falha, um responsável é avisado, em vez de o erro passar em silêncio.',
    ],
    scenario: {
      title: 'Pedido que chega por WhatsApp',
      before:
        'O cliente manda o pedido por WhatsApp. Alguém copia os itens para uma planilha, depois redigita tudo no sistema de gestão e, no fim do dia, lembra (ou não) de avisar o cliente que o pedido foi registrado.',
      after:
        'O pedido entra uma vez. A automação registra os itens no sistema, confirma o recebimento para o cliente e avisa a equipe quando falta alguma informação. Quem antes digitava passa a conferir só as exceções.',
    },
    deliverables: [
      'Mapa do processo atual e do processo automatizado',
      'Automações rodando nos sistemas que a empresa já usa',
      'Registro de cada execução, com data, dados e resultado',
      'Alertas quando uma etapa falha ou fica parada',
      'Documentação de como cada automação funciona',
    ],
    connects: [
      'WhatsApp e e-mail',
      'Planilhas Google e Excel',
      'CRMs e sistemas de gestão com API',
      'Formulários do site',
      'Qualquer sistema com API ou webhook',
    ],
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
      'Equipes cujo processo só funciona porque alguém lembra de executá-lo, e empresas que querem parar de gastar horas em tarefas que não exigem decisão.',
    faq: [
      {
        q: 'Preciso trocar meus sistemas para automatizar?',
        a: 'Não. A automação é construída em cima do que a empresa já usa. Trocar uma ferramenta só entra na conversa quando ela não oferece nenhuma forma de integração, e isso aparece no diagnóstico.',
      },
      {
        q: 'O que acontece se uma automação falhar?',
        a: 'Toda execução fica registrada e as falhas geram alerta para um responsável. O processo não para em silêncio: alguém fica sabendo e pode agir.',
      },
      {
        q: 'Dá para começar com um processo só?',
        a: 'Sim, e é o caminho recomendado. Começar pela rotina que mais consome tempo mostra resultado cedo e ajuda a decidir o que automatizar em seguida.',
      },
    ],
  },
  {
    slug: 'crm-gestao-comercial',
    category: 'CRM',
    title: 'CRM e Gestão Comercial',
    shortTitle: 'CRM',
    seoTitle: 'CRM sob Medida e Gestão Comercial para Empresas | HGA',
    visual: 'crm',
    description:
      'Um lugar único para acompanhar oportunidades, com histórico por contato e o próximo passo sempre visível.',
    metaDescription:
      'CRM e gestão comercial: funil com as etapas que o seu time usa, histórico de cada cliente, follow-ups com prazo e indicadores de conversão.',
    problem: [
      'Sem um lugar único, a informação comercial se espalha entre conversas de WhatsApp, planilhas e a memória de quem atendeu. Cada vendedor anota de um jeito, e o gestor só descobre como está o mês quando pergunta para cada um.',
      'Quando alguém sai de férias ou deixa a empresa, o histórico do cliente vai junto. Follow-ups ficam para trás e oportunidades esfriam sem que ninguém perceba.',
    ],
    how: [
      'Estruturamos o funil nas etapas que o time realmente usa, não em um modelo genérico. Cada oportunidade tem responsável, próximo passo e prazo, e o histórico de conversas fica registrado no contato.',
      'O CRM pode ser uma ferramenta existente, configurada e integrada, ou um sistema próprio quando o processo comercial tem particularidades. Os canais de atendimento, como WhatsApp e e-mail, entram no mesmo lugar, e os indicadores mostram em qual etapa as negociações estão travando.',
    ],
    scenario: {
      title: 'Lead que chega pelo site',
      before:
        'O formulário do site manda um e-mail. Alguém copia os dados para a planilha, passa o contato para um vendedor pelo WhatsApp e ninguém sabe se o retorno foi feito.',
      after:
        'O lead entra direto no funil, com a origem registrada, é distribuído para um responsável e gera uma tarefa de retorno com prazo. Se o prazo passar, o gestor vê no painel.',
    },
    deliverables: [
      'Funil configurado com as etapas reais do time',
      'Cadastro de contatos e empresas com histórico',
      'Tarefas e follow-ups com responsável e prazo',
      'Integração com WhatsApp, e-mail ou formulários',
      'Painel com conversão por etapa e por vendedor',
      'Importação dos contatos e oportunidades que já existem',
    ],
    connects: [
      'WhatsApp (API oficial da Meta, Evolution API, Z-API)',
      'E-mail',
      'Formulários e páginas de captura',
      'Sistemas de gestão com API',
      'Planilhas usadas hoje pelo time',
    ],
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
      'Previsão do mês saindo do funil, não de palpite',
      'Menos tempo montando relatório manualmente',
    ],
    audience:
      'Times comerciais que dependem de planilhas soltas, do WhatsApp pessoal ou da memória de cada vendedor para saber o que está em negociação.',
    faq: [
      {
        q: 'Vocês usam um CRM pronto ou desenvolvem do zero?',
        a: 'Depende do processo. Quando uma ferramenta existente atende, a HGA configura e integra. Quando o processo comercial tem particularidades que as ferramentas prontas não cobrem, o caminho é um sistema próprio. Isso é definido no diagnóstico.',
      },
      {
        q: 'Dá para trazer os dados das planilhas atuais?',
        a: 'Sim. A importação dos contatos e oportunidades que já existem faz parte do projeto, com limpeza de duplicados quando necessário.',
      },
      {
        q: 'As conversas de WhatsApp ficam no CRM?',
        a: 'Podem ficar. A integração registra as conversas no histórico do contato, para que qualquer pessoa do time consiga assumir um atendimento sabendo o que já foi falado.',
      },
    ],
  },
  {
    slug: 'inteligencia-artificial',
    category: 'IA aplicada',
    title: 'Inteligência Artificial Aplicada',
    shortTitle: 'IA aplicada',
    seoTitle: 'Inteligência Artificial Aplicada a Processos | HGA',
    visual: 'ia',
    description:
      'IA em pontos específicos da operação (triagem, primeira resposta, leitura de documento), com a decisão final no time.',
    metaDescription:
      'IA aplicada à operação: triagem de solicitações, rascunho de primeira resposta, resumo e leitura de documentos, com revisão humana onde a decisão pesa.',
    problem: [
      'Nem toda etapa precisa esperar alguém ficar livre. Classificar uma mensagem, resumir um histórico longo ou tirar dados de um documento são tarefas que tomam tempo e quase nunca exigem julgamento.',
      'Por outro lado, aplicar IA sem critério gera respostas erradas justamente onde errar é caro: no preço passado ao cliente, numa informação de contrato, num prazo prometido. O desafio não é usar IA, é saber onde ela entra.',
    ],
    how: [
      'Escolhemos com você as etapas em que a IA ajuda de fato (classificar, resumir, redigir um rascunho, extrair dados de um documento) e definimos o que ela não pode fazer sozinha.',
      'Onde a decisão tem peso, a IA prepara e uma pessoa aprova. Quando a IA não tem confiança suficiente na resposta, o caso vai direto para alguém do time. O modelo usado (OpenAI, Anthropic ou Google) é escolhido conforme custo, qualidade e o tipo de dado envolvido.',
    ],
    scenario: {
      title: 'Caixa de entrada do atendimento',
      before:
        'Todas as mensagens chegam na mesma fila. Alguém lê uma por uma para descobrir o assunto, a urgência e quem deve responder, e só depois o atendimento começa.',
      after:
        'Cada mensagem chega classificada por assunto e prioridade, com um rascunho de resposta. O atendente revisa, ajusta se precisar e envia. Os casos sensíveis vão direto para uma pessoa, sem rascunho automático.',
    },
    deliverables: [
      'Definição das etapas em que a IA entra e das que ficam com o time',
      'Fluxos de triagem, resumo ou extração funcionando',
      'Regras de revisão humana para as decisões que pesam',
      'Registro do que a IA sugeriu e do que foi aprovado',
      'Ajuste das instruções com base nos casos reais',
      'Um mês de teste com medição do consumo real e projeção do gasto mensal',
    ],
    connects: [
      'WhatsApp, e-mail e chat do site',
      'CRM e ferramentas de atendimento',
      'Documentos em PDF e imagens',
      'Planilhas e bancos de dados',
      'Modelos da OpenAI, Anthropic e Google',
    ],
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
      'Operações com volume alto de mensagens, documentos ou solicitações para triar, que querem ganhar tempo sem perder o controle sobre o que é dito ao cliente.',
    faq: [
      {
        q: 'A IA vai responder meus clientes sozinha?',
        a: 'Só se você decidir que sim, e apenas nos casos em que o risco de erro é baixo. O padrão é a IA preparar e uma pessoa aprovar, principalmente quando envolve preço, prazo ou informação de contrato.',
      },
      {
        q: 'Que dados são enviados para a IA?',
        a: 'O projeto define quais informações podem ir para o modelo e quais ficam de fora. Dados que não são necessários para a tarefa não são enviados, e cada uso fica registrado.',
      },
      {
        q: 'Quanto custa usar IA no dia a dia?',
        a: 'Depende do volume de mensagens ou documentos e do modelo escolhido, e só fica claro com o uso real. Por isso o primeiro mês funciona como teste: o consumo é medido e comparado com a demanda normal da empresa, para saber se foi um mês típico ou atípico. A partir daí dá para projetar o gasto mensal com base em uso de verdade.',
      },
    ],
  },
  {
    slug: 'integracao-de-sistemas',
    category: 'Integrações',
    title: 'Integração de Sistemas',
    shortTitle: 'Integrações',
    seoTitle: 'Integração de Sistemas: CRM, ERP e WhatsApp via API | HGA',
    visual: 'integracao',
    description:
      'As ferramentas que a empresa já usa passam a trocar informação entre si, sem ninguém copiando dado no meio.',
    metaDescription:
      'Integração de sistemas via API e webhook: CRM, ERP, WhatsApp, formulários e bancos de dados trocando informação sem copia-e-cola.',
    problem: [
      'Cada área adota a ferramenta que resolve o problema dela: o comercial usa um CRM, o financeiro usa o sistema de gestão, o atendimento vive no WhatsApp. Separadas, todas funcionam.',
      'O problema é o meio do caminho. Alguém copia o pedido de um sistema para o outro, confere à mão se o cadastro bate e só descobre a divergência quando o número do fim do mês não fecha.',
    ],
    how: [
      'Conectamos os sistemas por API, webhook ou diretamente pelo banco de dados, conforme o que cada ferramenta permite. Antes de ligar qualquer coisa, definimos qual sistema é a fonte de verdade de cada informação: quem manda no cadastro do cliente, no preço, no estoque.',
      'Também definimos o que acontece quando algo dá errado. Se um sistema estiver fora do ar, a informação fica guardada e é reenviada; se os dados divergirem, alguém é avisado, em vez de um lado sobrescrever o outro.',
    ],
    scenario: {
      title: 'Venda fechada no CRM',
      before:
        'O vendedor fecha a venda no CRM e manda um print para o financeiro, que redigita o pedido no sistema de gestão para emitir a cobrança. Se alguém erra um item, ninguém percebe até o cliente reclamar.',
      after:
        'Ao marcar a venda como fechada, o pedido é criado no sistema de gestão com os mesmos dados. A cobrança sai de lá, e o status do pagamento volta para o CRM, onde o vendedor acompanha.',
    },
    deliverables: [
      'Mapa de quais dados circulam entre quais sistemas',
      'Definição da fonte de verdade de cada informação',
      'Integrações rodando por API, webhook ou banco de dados',
      'Reenvio automático quando um sistema fica fora do ar',
      'Alertas para divergências e falhas',
      'Documentação técnica das integrações',
    ],
    connects: [
      'WhatsApp (API oficial da Meta, Evolution API, Z-API)',
      'E-mail transacional',
      'CRMs e sistemas de gestão com API',
      'Formulários e sites',
      'Bancos de dados como PostgreSQL',
      'Planilhas Google e Excel',
    ],
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
      'Cada informação com um único dono e um único valor',
      'Trocar uma ferramenta não exige refazer tudo',
    ],
    audience:
      'Empresas com várias ferramentas que não conversam entre si, e com alguém no meio do caminho fazendo o papel de integração manual.',
    faq: [
      {
        q: 'Meu sistema não tem API. Ainda dá para integrar?',
        a: 'Muitas vezes sim, por exportação de arquivos, acesso ao banco de dados ou outros caminhos. Quando não há nenhuma forma segura de integração, isso fica claro no diagnóstico, antes de qualquer proposta.',
      },
      {
        q: 'E se um dos sistemas sair do ar?',
        a: 'A integração é feita para tolerar instabilidade: o que não pôde ser enviado fica guardado e é reenviado quando o sistema volta. Se a falha persistir, um responsável é avisado.',
      },
      {
        q: 'Dá para integrar com o WhatsApp?',
        a: 'Sim. Dá para receber e enviar mensagens a partir de outros sistemas, registrar as conversas no CRM e disparar avisos automáticos, pela API oficial da Meta ou por outras opções, conforme o caso.',
      },
    ],
  },
  {
    slug: 'dashboards-bi',
    category: 'Dados',
    title: 'Dashboards e BI',
    shortTitle: 'Dashboards',
    seoTitle: 'Dashboards e BI para Empresas: Indicadores Atualizados | HGA',
    visual: 'dashboards',
    description:
      'Os dados que já existem na operação reunidos em indicadores que respondem perguntas de decisão.',
    metaDescription:
      'Dashboards e BI: indicadores atualizados a partir dos dados que a operação já gera, visão consolidada entre áreas e alertas quando um número sai da faixa.',
    problem: [
      'O dado existe, mas está espalhado: vendas no CRM, faturamento no sistema de gestão, atendimento em outra ferramenta. Montar um número confiável exige exportar planilhas, cruzar na mão e torcer para ninguém ter errado uma coluna.',
      'O resultado são reuniões gastas discutindo qual número está certo, e problemas que só aparecem no fechamento do mês, quando já não dá mais para agir.',
    ],
    how: [
      'Antes de desenhar qualquer gráfico, definimos quais perguntas o painel precisa responder e quem vai olhar para ele. Um painel para a diretoria e um para a operação mostram coisas diferentes.',
      'Depois consolidamos as fontes em uma base única, com uma regra de cálculo clara para cada indicador, e montamos os painéis com atualização automática. Quando um número sai da faixa esperada, o responsável recebe um alerta.',
    ],
    scenario: {
      title: 'Reunião comercial de segunda-feira',
      before:
        'Na sexta, alguém exporta as vendas do CRM, junta com o faturamento e monta uma apresentação. Na segunda, metade da reunião é gasta conferindo se os números batem.',
      after:
        'O painel já está atualizado quando a reunião começa, com a mesma regra de cálculo para todo mundo. O tempo vai para decidir o que fazer com o número, não para discutir se ele está certo.',
    },
    deliverables: [
      'Lista de indicadores, com a definição e a regra de cálculo de cada um',
      'Base consolidada a partir das fontes existentes',
      'Painéis por área, com atualização automática',
      'Alertas para números fora da faixa esperada',
      'Acesso com permissão por perfil',
      'Exportação dos dados para quem precisa do bruto',
    ],
    connects: [
      'CRMs e sistemas de gestão',
      'Planilhas Google e Excel',
      'Bancos de dados',
      'Ferramentas de atendimento',
      'Qualquer fonte com API ou exportação',
    ],
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
      'Empresas que já têm dados, mas não têm uma forma rápida e confiável de olhar para eles, e que hoje decidem com base em planilha montada à mão.',
    faq: [
      {
        q: 'Preciso pagar uma ferramenta de BI?',
        a: 'Não necessariamente. Dependendo do volume e de quem vai acessar, o painel pode usar uma ferramenta gratuita, uma ferramenta de BI de mercado ou ficar dentro de um sistema próprio. A escolha entra na proposta, com o custo de cada opção.',
      },
      {
        q: 'De quanto em quanto tempo os números atualizam?',
        a: 'Depende da fonte e da necessidade: alguns indicadores precisam estar sempre atualizados, outros podem ser diários. Isso é definido junto com os indicadores.',
      },
      {
        q: 'E se os dados de origem estiverem bagunçados?',
        a: 'É comum. Parte do projeto é identificar as inconsistências nas fontes e definir como tratá-las, para que o painel mostre um número em que dá para confiar.',
      },
    ],
  },
  {
    slug: 'sistemas-sob-medida',
    category: 'Software',
    title: 'Sistemas Sob Medida',
    shortTitle: 'Sob medida',
    seoTitle: 'Desenvolvimento de Software e Sistemas sob Medida | HGA',
    visual: 'sistemas',
    description:
      'Quando o processo não cabe em ferramenta de prateleira, construímos o sistema em volta de como a operação funciona.',
    metaDescription:
      'Desenvolvimento de software sob medida em São Paulo: sistemas web desenhados a partir do processo real da empresa e entregues em ciclos curtos.',
    problem: [
      'Ferramenta pronta resolve o caso médio do mercado. Quando o processo da empresa tem uma particularidade, e muitas vezes é ela que diferencia a empresa, o time acaba adaptando o próprio trabalho ao software.',
      'O custo aparece aos poucos: planilhas paralelas para cobrir o que a ferramenta não faz, módulos pagos que ninguém usa e retrabalho toda vez que o processo muda e o sistema não acompanha.',
    ],
    how: [
      'Levantamos o fluxo real com quem executa, desenhamos o sistema em volta dele e entregamos em ciclos curtos: a primeira parte fica pronta cedo, é usada de verdade e os ajustes acontecem antes de virar retrabalho.',
      'Os sistemas são aplicações web, acessadas pelo navegador no computador ou no celular, construídas com tecnologias de mercado como Next.js, React e PostgreSQL. Tudo fica documentado, para que o sistema possa evoluir quando o negócio mudar.',
    ],
    scenario: {
      title: 'Controle de ordens de serviço',
      before:
        'As ordens de serviço são abertas em papel ou planilha, o técnico avisa o andamento por mensagem e o gestor não sabe quantas estão atrasadas sem ligar para cada um.',
      after:
        'Cada ordem é aberta no sistema, o técnico atualiza o andamento pelo celular e o gestor vê na tela o que está em aberto, atrasado ou concluído. O cliente pode ser avisado automaticamente a cada etapa.',
    },
    deliverables: [
      'Levantamento do processo e desenho das telas antes do código',
      'Sistema web funcionando no computador e no celular',
      'Entregas em ciclos, com demonstração a cada etapa',
      'Controle de acesso por perfil de usuário',
      'Documentação técnica e de uso',
      '30 dias de acompanhamento e 90 dias de correção de falhas',
    ],
    connects: [
      'Sistemas que a empresa já usa, via API',
      'WhatsApp e e-mail',
      'Planilhas e bancos de dados existentes',
      'Login por e-mail ou conta Google',
    ],
    examples: [
      'Aplicações web internas',
      'Portais para cliente ou parceiro',
      'Ferramentas de operação específicas',
      'Sistemas que ferramentas prontas não cobrem',
      'Áreas internas com regras próprias de negócio',
    ],
    benefits: [
      'O sistema acompanha o processo, não o contrário',
      'Sem pagar por módulo que não se usa',
      'Mudança de processo vira ajuste no sistema, não planilha paralela',
      'Evolução contínua depois da entrega',
    ],
    audience:
      'Empresas cujo processo não cabe em uma ferramenta pronta, ou que pagam por várias ferramentas e ainda mantêm planilhas paralelas para fechar a conta.',
    faq: [
      {
        q: 'Quanto tempo leva para ter o sistema funcionando?',
        a: 'Depende do tamanho do processo. Como a entrega é em ciclos, a primeira parte costuma ser usada bem antes do sistema completo ficar pronto. O prazo de cada ciclo vem definido na proposta.',
      },
      {
        q: 'Funciona no celular?',
        a: 'Sim. Os sistemas são web e se adaptam à tela: funcionam no navegador do computador e do celular, sem precisar instalar nada pela loja de aplicativos.',
      },
      {
        q: 'Depois de pronto, o sistema pode mudar?',
        a: 'Pode. Ajustes de uso entram no acompanhamento de 30 dias após a entrega, e falhas no que foi entregue são corrigidas sem custo por 90 dias. Novas funcionalidades são orçadas à parte.',
      },
    ],
  },
]

export function getSolutionBySlug(slug: string): Solution | undefined {
  return solutions.find((solution) => solution.slug === slug)
}
