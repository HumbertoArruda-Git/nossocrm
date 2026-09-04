import { ArrowRight, ArrowUpRight, Blocks, RefreshCw, Route, ScanText, Search, Timer, Workflow, Wrench } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { HeroPanel } from '@/components/landing/HeroPanel'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { AnchorScroll } from '@/components/landing/AnchorScroll'
import { SolutionVisual } from '@/components/landing/SolutionVisual'
import { ContactForm } from '@/components/landing/ContactForm'
import { exo2 } from '@/lib/fonts/exo2'
import { archivo, plexMono } from '@/lib/fonts/landing'
import { solutions } from '@/lib/content/solutions'

const OG_IMAGE = {
  url: '/api/og',
  width: 1200,
  height: 630,
  alt: 'HGA Systems: automação, CRM e integrações sob medida',
}

export const viewport: Viewport = {
  // a barra do navegador no celular acompanha a tinta da página
  themeColor: '#04060C',
}

export const metadata: Metadata = {
  title: 'HGA Systems | Automação, CRM e sistemas sob medida',
  description:
    'A HGA constrói automação de processos, CRM, integrações e painéis sob medida para organizar a operação e colocar o dado onde a decisão acontece.',
  manifest: null,
  // o layout raiz serve o ícone do NossoCRM; na landing quem assina é a HGA
  icons: { icon: [{ url: '/icons/hga.svg', type: 'image/svg+xml' }] },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'HGA Systems | Automação, CRM e sistemas sob medida',
    description:
      'Automação de processos, CRM, integrações e painéis sob medida para organizar a operação e colocar o dado onde a decisão acontece.',
    url: '/',
    siteName: 'HGA Systems',
    locale: 'pt_BR',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HGA Systems | Automação, CRM e sistemas sob medida',
    description:
      'Automação de processos, CRM, integrações e painéis sob medida para organizar a operação.',
    images: [OG_IMAGE.url],
  },
}

const capabilities = [
  { icon: Route, title: 'Processo antes de código', text: 'O levantamento começa com quem executa a rotina, não com a ferramenta.' },
  { icon: Blocks, title: 'Integra com o que já existe', text: 'Conectamos CRM, ERP, WhatsApp e planilhas em vez de exigir troca total.' },
  { icon: ScanText, title: 'IA onde ela ajuda', text: 'Triagem, rascunho e leitura de documento, com revisão humana onde pesa.' },
  { icon: Timer, title: 'Entrega em ciclos curtos', text: 'Você vê funcionando cedo e corrige rota antes de virar retrabalho.' },
]

const today = [
  'O mesmo dado é digitado em dois ou três lugares',
  'O follow-up depende de alguém lembrar',
  'Cada área tem sua planilha, com números diferentes',
  'O histórico do cliente está no WhatsApp de quem atendeu',
  'Montar um relatório leva mais tempo do que analisá-lo',
]

const after = [
  'O dado entra uma vez e circula entre os sistemas',
  'A rotina roda sozinha, com registro de cada execução',
  'Um número só, com a mesma origem para todo mundo',
  'Histórico no CRM, acessível a quem precisar assumir',
  'O indicador já está pronto quando a reunião começa',
]

const process = [
  { n: '01', icon: Search, title: 'Entender', text: 'Acompanhamos a rotina real e mapeamos onde o tempo e o retrabalho estão.' },
  { n: '02', icon: Workflow, title: 'Desenhar', text: 'Definimos o fluxo, o que automatizar e o que continua sendo decisão humana.' },
  { n: '03', icon: Wrench, title: 'Construir', text: 'Entregamos em ciclos curtos, integrando com os sistemas que já estão em uso.' },
  { n: '04', icon: RefreshCw, title: 'Evoluir', text: 'Depois da entrega, ajustamos conforme a operação muda e novas necessidades aparecem.' },
]

const benefits = [
  { title: 'Menos trabalho manual', text: 'As etapas repetitivas saem da mão da equipe e passam a rodar sozinhas.' },
  { title: 'Mais controle do processo', text: 'Dá para ver em que ponto cada coisa está e o que ficou parado.' },
  { title: 'Resposta mais rápida', text: 'Triagem e primeira resposta deixam de depender de alguém estar livre.' },
  { title: 'Dado confiável para decidir', text: 'Um indicador só, atualizado, com origem clara.' },
]

/**
 * Dados de mercado — cada número foi conferido na fonte oficial (set/2026):
 *  74%  Zendesk CX Trends 2026: "74% of consumers now expect customer service to be available 24/7"
 *  88%  Zendesk CX Trends 2026: "88% of customers expect faster response times than they did just a year ago"
 *  20%  Salesforce: "Service teams that use AI agents expect their service costs and case
 *       resolution times to decrease by an average of 20%"
 *  17%  IBM (via IBM Institute for Business Value, 2025): "Mature AI adopters ... reported
 *       17% higher customer satisfaction"
 * Os links apontam para a página em que a estatística aparece de fato.
 */
const marketStats = [
  {
    value: '74%',
    desc: 'dos consumidores dizem que, por causa da IA, esperam atendimento disponível 24/7.',
    source: 'Zendesk CX Trends 2026',
    url: 'https://cxtrends.zendesk.com/',
  },
  {
    value: '88%',
    desc: 'esperam respostas mais rápidas do que esperavam há um ano.',
    source: 'Zendesk CX Trends 2026',
    url: 'https://cxtrends.zendesk.com/',
  },
  {
    value: '~20%',
    desc: 'é a redução média esperada em custo de serviço e tempo de resolução por equipes que usam agentes de IA.',
    source: 'Salesforce',
    url: 'https://www.salesforce.com/service/what-is-customer-service/stats/',
  },
  {
    value: '~17%',
    desc: 'foi o ganho de satisfação relatado por adotantes maduros de IA em atendimento.',
    source: 'IBM',
    url: 'https://www.ibm.com/think/insights/customer-service-future',
  },
]

export default function HomePage() {
  return (
    <div className={`hga-site ${exo2.variable} ${archivo.variable} ${plexMono.variable}`}>
      <AnchorScroll />
      <SiteHeader />

      <main>
        {/* ---------- Hero ----------
            Tipografia sobre uma única fonte de luz. O horizonte curvo é o corte
            entre a luz e o breu — é ele que dá escala à dobra. */}
        <section className="hga-hero" id="inicio">
          <div className="hga-hero-light" aria-hidden="true">
            <span className="hga-hero-beam" />
            <span className="hga-hero-arc" />
          </div>

          <div className="hga-hero-inner">
            <p className="hga-eyebrow">Automação · CRM · Integrações · Dados</p>
            <h1>Automação, CRM e integrações sob medida para a sua operação.</h1>
            <p className="hga-lead">
              A HGA desenha e constrói o software que organiza o processo, conecta os sistemas que
              você já usa e coloca o dado onde a decisão acontece.
            </p>
            <div className="hga-actions">
              <Link className="hga-btn hga-btn-primary" href="#solucoes">
                Ver soluções <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="hga-btn hga-btn-ghost" href="#contato">
                Falar sobre o seu caso
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- Artefato ----------
            A prova vem logo depois da tese: uma automação rodando de verdade,
            iluminada pela mesma luz do hero. */}
        <section className="hga-showcase" aria-label="Exemplo de automação em execução">
          <div className="hga-showcase-frame">
            <HeroPanel />
          </div>
        </section>

        {/* ---------- Capacidades ---------- */}
        <section className="hga-band" aria-label="Como a HGA trabalha">
          <ul className="hga-band-grid">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="hga-band-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.6} />
                </span>
                <h2 className="hga-band-title">{title}</h2>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Soluções ---------- */}
        <section className="hga-section" id="solucoes">
          <header className="hga-head">
            <p className="hga-eyebrow">Soluções</p>
            <h2>Seis frentes, resolvendo problemas diferentes da mesma operação.</h2>
            <p className="hga-head-lead">
              Cada frente tem uma página com o problema que resolve, como funciona e para quem é
              indicada.
            </p>
          </header>

          <div className="hga-cards">
            {solutions.map((solution, index) => (
              <ScrollReveal key={solution.slug} delay={Math.min(index, 3) * 0.05}>
                <Link href={`/solucoes/${solution.slug}`} className="hga-card">
                  <SolutionVisual name={solution.visual} />
                  <div className="hga-card-body">
                    <p className="hga-card-cat">{solution.category}</p>
                    <h3>{solution.title}</h3>
                    <p className="hga-card-desc">{solution.description}</p>
                    <span className="hga-card-link">
                      Ver detalhes <ArrowUpRight size={14} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          {/* Quem se convenceu aqui não deveria ter que rolar até o rodapé.
              É um convite discreto, sem luz própria: a página tem dois
              momentos de luz e este não é um deles. */}
          <aside className="hga-nudge">
            <div className="hga-nudge-copy">
              <h3>Não sabe qual frente é a sua?</h3>
              <p>
                Na maioria dos casos o problema atravessa mais de uma. Descreva a rotina que mais
                trava e a gente aponta por onde começar.
              </p>
            </div>
            <Link className="hga-btn hga-btn-primary" href="#contato">
              Falar sobre o seu caso <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </aside>
        </section>

        {/* ---------- Problema → transformação ---------- */}
        <section className="hga-section" id="operacao">
          <header className="hga-head">
            <p className="hga-eyebrow">O problema</p>
            <h2>Quase sempre o gargalo não é falta de ferramenta.</h2>
            <p className="hga-head-lead">
              É informação espalhada, etapa manual e sistema que não conversa. O trabalho é reorganizar
              isso, não empilhar mais um software.
            </p>
          </header>

          <div className="hga-compare">
            <ScrollReveal className="hga-compare-col" direction="left">
              <div className="hga-compare-inner">
                <p className="hga-compare-tag">Como costuma estar</p>
                <ul className="hga-list hga-list-before">
                  {today.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal className="hga-compare-col" direction="right" delay={0.08}>
              <div className="hga-compare-inner hga-compare-after">
                <p className="hga-compare-tag">Depois de organizar</p>
                <ul className="hga-list hga-list-after">
                  {after.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ---------- Como trabalhamos ----------
            Aqui a numeração é informação: as quatro etapas acontecem nessa ordem. */}
        <section className="hga-section" id="processo">
          <header className="hga-head">
            <p className="hga-eyebrow">Como trabalhamos</p>
            <h2>Quatro etapas, sem cerimônia desnecessária.</h2>
          </header>

          {/* O trilho liga as quatro etapas e se preenche conforme a seção
              entra em cena. Sem ScrollReveal por etapa: o trilho avançando já
              é a revelação, e quatro fades soltos brigariam com ele. */}
          <ol className="hga-steps">
            {process.map(({ n, icon: Icon, title, text }) => (
              <li className="hga-step" key={n}>
                <span className="hga-step-node" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.6} />
                </span>
                <span className="hga-step-n">{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Benefícios ---------- */}
        <section className="hga-section" id="resultados">
          <header className="hga-head">
            <p className="hga-eyebrow">O que muda</p>
            <h2>O efeito prático aparece na rotina, não no discurso.</h2>
          </header>

          <ul className="hga-benefits">
            {benefits.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 0.05}>
                <li>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              </ScrollReveal>
            ))}
          </ul>
        </section>

        {/* ---------- Mercado ---------- */}
        <section className="hga-section" id="mercado">
          <header className="hga-head">
            <p className="hga-eyebrow">Contexto de mercado</p>
            <h2>A expectativa do cliente mudou antes das operações mudarem.</h2>
            <p className="hga-head-lead">
              A HGA ainda está construindo o próprio histórico de cases, então os números abaixo são de
              pesquisas públicas, com a fonte sempre à vista.
            </p>
          </header>

          <ul className="hga-stats">
            {marketStats.map((stat, index) => (
              <ScrollReveal key={stat.source + stat.value} delay={index * 0.05}>
                <li>
                  <span className="hga-stat-value">{stat.value}</span>
                  <p className="hga-stat-desc">{stat.desc}</p>
                  <a className="hga-stat-source" href={stat.url} target="_blank" rel="noopener noreferrer">
                    {stat.source} <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                </li>
              </ScrollReveal>
            ))}
          </ul>
        </section>

        {/* ---------- Contato ----------
            Fecha a página com a mesma luz que a abriu, agora vindo de baixo. */}
        <section className="hga-contact" id="contato">
          <div className="hga-contact-light" aria-hidden="true" />
          <div className="hga-contact-grid">
            <div className="hga-contact-copy">
              <p className="hga-eyebrow">Contato</p>
              <h2>Conte o que está travando hoje.</h2>
              <p className="hga-head-lead">
                Descreva o cenário em poucas linhas. Se der para ajudar, respondo com um caminho
                possível; se não for o nosso escopo, digo isso direto.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
