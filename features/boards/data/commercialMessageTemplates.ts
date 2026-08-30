export interface CommercialMessageTemplate {
  id: string;
  label: string;
  text: string;
}

export const COMMERCIAL_MESSAGE_TEMPLATES: CommercialMessageTemplate[] = [
  { id: 'mensagem-inicial', label: 'Mensagem inicial', text: `Olá, [Nome]. Dei uma olhada na [Empresa] e percebi [Contexto real do negócio].

Notei também que [Problema ou oportunidade específica].

Trabalho com soluções para organizar e automatizar esse tipo de processo e pensei em uma forma simples de melhorar isso aí.

Se fizer sentido, consigo te mostrar a ideia em uns 10 minutos. Tem algum horário tranquilo amanhã?` },
  { id: 'follow-up-1', label: 'Follow-up 1', text: `Oi, [Nome]. Passando só para retomar minha mensagem anterior.

A ideia que pensei para a [Empresa] é bem objetiva e está ligada a [Problema observado].

Se fizer sentido, te mostro rapidamente como eu estruturaria isso. São 10 minutos mesmo.` },
  { id: 'follow-up-2', label: 'Follow-up 2', text: `Olá, [Nome]. Vou encerrar por aqui para não ficar insistindo.

Só quis te procurar porque realmente identifiquei uma oportunidade em [Problema/oportunidade].

Se em algum momento isso virar prioridade para vocês, fico à disposição para te mostrar a ideia.` },
  { id: 'confirmacao-reuniao', label: 'Confirmação de reunião', text: `Olá, [Nome]. Tudo certo para nossa conversa hoje às [Horário]?

Vou usar esse tempo principalmente para entender como vocês trabalham hoje e onde está o principal gargalo. Depois te mostro o que eu vejo como caminho possível.` },
  { id: 'pos-reuniao', label: 'Pós-reunião', text: `Obrigado pelo tempo hoje, [Nome].

Pelo que conversamos, o principal ponto é [Problema], que hoje acaba gerando [Impacto].

Vou estruturar uma solução considerando o cenário que você me passou e te apresentar as opções que fazem mais sentido.

Combinamos de falar novamente em [Data/Horário].` },
  { id: 'envio-proposta', label: 'Envio / apresentação de proposta', text: `Olá, [Nome]. Estruturei a proposta com base no que levantamos na nossa conversa.

Separei três caminhos: uma implementação mais enxuta, a opção que considero mais adequada para o cenário de vocês e uma alternativa mais completa.

Minha recomendação é a [Opção recomendada], principalmente por [Motivo].

Como combinamos, podemos olhar juntos em [Data/Horário] e eu te explico rapidamente as diferenças.` },
  { id: 'follow-up-proposta', label: 'Follow-up de proposta', text: `Oi, [Nome]. Queria saber se você conseguiu analisar a proposta.

Ficou algum ponto em aberto sobre escopo, prazo ou investimento que eu possa esclarecer?` },
  { id: 'vou-pensar', label: 'Resposta a “vou pensar”', text: `Claro. O que exatamente você gostaria de avaliar melhor antes de decidir?

Depois:

Perfeito. Então combinamos de retomar isso em [Data]?` },
  { id: 'esta-caro', label: 'Resposta a “está caro”', text: `Entendo. Fora o investimento, tem mais algum ponto que está te segurando?

Depois:

Pelo que você me explicou, hoje [Resumo do impacto]. Por isso recomendei essa opção.

Se o investimento estiver acima do que vocês conseguem assumir agora, podemos revisar o escopo e começar por uma versão mais enxuta.` },
  { id: 'aceite-fechamento', label: 'Aceite / fechamento', text: `Perfeito, [Nome].

Então seguimos com a opção [Opção], no valor de [R$ valor], com [Prazo].

O próximo passo é a entrada de 50% para iniciarmos o kickoff e formalizarmos o início do projeto.

Assim que confirmado, já alinhamos a primeira reunião e o cronograma.` },
  { id: 'atualizacao-projeto', label: 'Atualização durante o projeto', text: `Olá, [Nome]. Atualização rápida do projeto:

concluímos [Etapa concluída].

Agora estamos seguindo com [Próxima etapa].

Até aqui seguimos dentro do cronograma previsto.` },
  { id: 'fora-do-escopo', label: 'Solicitação fora do escopo', text: `Faz sentido o que você está pedindo.

Esse ponto não estava previsto no escopo inicial, então temos dois caminhos: deixamos para uma segunda etapa depois da entrega atual ou ajustamos prazo e valor para incluir agora.

Qual opção faz mais sentido para você?` },
  { id: 'oferta-manutencao', label: 'Oferta de manutenção', text: `Seu projeto está entregue e funcionando.

A partir daqui, se fizer sentido, a HGA Systems pode continuar cuidando de monitoramento, correções, pequenos ajustes e suporte para vocês não precisarem se preocupar com essa parte.

Tenho algumas opções de acompanhamento mensal dependendo do nível de suporte que vocês quiserem.` },
];
