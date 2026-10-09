import { faq } from '@/lib/content/faq'
import { processSteps } from '@/lib/content/process'
import { solutions } from '@/lib/content/solutions'
import { HGA_CONTACT, SITE_URL } from '@/lib/seo/site'

/**
 * /llms.txt — resumo da HGA para assistentes de IA (formato llmstxt.org).
 *
 * Gerado a partir do mesmo conteúdo das páginas, para nunca divergir delas.
 * Só fatos confirmados: sem CNPJ, cases, clientes ou preços que não existem.
 */
export const dynamic = 'force-static'

function build() {
  const lines: string[] = [
    '# HGA Systems',
    '',
    `> Software house em ${HGA_CONTACT.city}/${HGA_CONTACT.region} que desenvolve software sob medida: automação de processos, CRM, integração de sistemas, inteligência artificial aplicada e dashboards. O primeiro passo é um diagnóstico gratuito; cada projeto tem proposta com escopo, prazo e valor definidos antes de qualquer compromisso.`,
    '',
    `- Contato: ${HGA_CONTACT.email} · WhatsApp ${HGA_CONTACT.phoneDisplay}`,
    `- Atendimento: ${HGA_CONTACT.city}, ${HGA_CONTACT.region}, Brasil`,
    '- Preço: sem tabela; o valor depende do serviço, da complexidade e das integrações',
    '- Garantia: 30 dias de acompanhamento próximo e 90 dias de correção de falhas sem custo após a entrega; novas funcionalidades são orçadas à parte',
    '',
    '## Soluções',
    '',
    ...solutions.map((s) => `- [${s.title}](${SITE_URL}/solucoes/${s.slug}): ${s.description}`),
    '',
    '## Como um projeto funciona',
    '',
    ...processSteps.map((step) => `${Number(step.n)}. ${step.title}: ${step.text}`),
    '',
    '## Perguntas frequentes',
    '',
    ...faq.flatMap((item) => [`### ${item.q}`, '', item.a, '']),
    '## Optional',
    '',
    `- [Aviso de privacidade](${SITE_URL}/privacidade): como os dados do formulário de contato são tratados`,
    '',
  ]
  return lines.join('\n')
}

export function GET() {
  return new Response(build(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
