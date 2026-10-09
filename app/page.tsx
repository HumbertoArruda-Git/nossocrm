import { ArrowRight, ArrowUpRight, Blocks, Mail, MapPin, MessageCircle, Route, ScanText, Timer } from 'lucide-react'
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
import { faq } from '@/lib/content/faq'
import { JsonLd } from '@/components/landing/JsonLd'
import { faqJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld'
import { HGA_CONTACT, WHATSAPP_URL } from '@/lib/seo/site'

const OG_IMAGE = {
  url: '/api/og',
  width: 1200,
  height: 630,
  alt: 'HGA Systems: software sob medida, automação, CRM e integrações',
}

export const viewport: Viewport = {
  // a barra do navegador no celular acompanha a tinta da página
  themeColor: '#04060C',
}

const TITLE = 'Software sob medida, automação e CRM | HGA Systems'
const DESCRIPTION =
  'Software sob medida em São Paulo: automação de processos, CRM, integrações e painéis para organizar a operação. Diagnóstico gratuito.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  manifest: null,
  robots: { index: true, follow: true },
  // o layout raiz serve o ícone do NossoCRM; na landing quem assina é a HGA
  icons: { icon: [{ url: '/icons/hga.svg', type: 'image/svg+xml' }] },
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    siteName: 'HGA Systems',
    locale: 'pt_BR',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
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

/** O processo já é o "como começa": a primeira etapa é o diagnóstico sem custo. */
const process = [
  { n: '01', title: 'Diagnóstico gratuito', text: 'Você conta a rotina que mais trava. A gente mapeia onde estão o tempo e o retrabalho, sem custo.' },
  { n: '02', title: 'Proposta fechada', text: 'Escopo, prazo e valor definidos por escrito, antes de qualquer compromisso.' },
  { n: '03', title: 'Construção em ciclos', text: 'Entregas curtas, integradas aos sistemas em uso, com relatórios do andamento a cada etapa.' },
  { n: '04', title: 'Acompanhamento', text: '30 dias de acompanhamento próximo e 90 dias de correção de falhas sem custo após a entrega.' },
]

/**
 * Dados de mercado — cada número foi conferido na fonte oficial (set/2026):
 *  74%  Zendesk CX Trends 2026: "74% of consumers now expect customer service to be available 24/7"
 *  88%  Zendesk CX Trends 2026: "88% of customers expect faster response times than they did just a year ago"
 * Os links apontam para a página em que a estatística aparece de fato.
 */
const marketStats = [
  {
    value: '74%',
    desc: 'dos consumidores esperam atendimento disponível 24 horas por dia, 7 dias por semana.',
    source: 'Zendesk CX Trends 2026',
    url: 'https://cxtrends.zendesk.com/',
  },
  {
    value: '88%',
    desc: 'esperam respostas mais rápidas do que esperavam há um ano.',
    source: 'Zendesk CX Trends 2026',
    url: 'https://cxtrends.zendesk.com/',
  },
]

export default function HomePage() {
  return (
    <div className={`hga-site ${exo2.variable} ${archivo.variable} ${plexMono.variable}`}>
      <JsonLd nodes={[organizationJsonLd(), websiteJsonLd(), faqJsonLd(faq)]} />
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
            <p className="hga-eyebrow">Software sob medida · São Paulo</p>
            <h1>Pare de digitar o mesmo dado em três sistemas.</h1>
            <p className="hga-lead">
              A HGA desenvolve software sob medida: automatiza rotinas, organiza o comercial no CRM e
              conecta WhatsApp, ERP e planilhas, sem obrigar você a trocar o que já usa.
            </p>
            <div className="hga-actions">
              <Link className="hga-btn hga-btn-primary" href="#contato">
                Pedir diagnóstico gratuito <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="hga-btn hga-btn-ghost" href="#solucoes">
                Ver soluções
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
        <section className="hga-band" aria-labelledby="hga-band-title">
          <h2 id="hga-band-title" className="sr-only">Como a HGA trabalha</h2>
          <ul className="hga-band-grid">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="hga-band-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.6} />
                </span>
                <h3 className="hga-band-title">{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Soluções ---------- */}
        <section className="hga-section" id="solucoes">
          <header className="hga-head">
            <p className="hga-eyebrow">Soluções</p>
            <h2>Por onde dá para começar.</h2>
            <p className="hga-head-lead">
              Seis tipos de projeto. Cada um tem uma página com o problema que resolve, como funciona
              e para quem é indicado.
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
              <h3>Não sabe por onde começar?</h3>
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
            <h2>Do diagnóstico ao sistema rodando, em quatro etapas.</h2>
          </header>

          {/* O trilho liga as quatro etapas e se preenche conforme a seção
              entra em cena. Sem ScrollReveal por etapa: o trilho avançando já
              é a revelação, e quatro fades soltos brigariam com ele. */}
          <ol className="hga-steps">
            {process.map(({ n, title, text }) => (
              <li className="hga-step" key={n}>
                <span className="hga-step-node" aria-hidden="true" />
                <span className="hga-step-n">{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Mercado ---------- */}
        <section className="hga-section" id="mercado">
          <header className="hga-head">
            <p className="hga-eyebrow">Contexto de mercado</p>
            <h2>A expectativa do cliente mudou antes das operações mudarem.</h2>
            <p className="hga-head-lead">
              A HGA está começando a construir o próprio histórico de projetos. Por isso os números
              abaixo são de pesquisas públicas, com a fonte à vista, e o primeiro passo com a HGA é um
              diagnóstico sem custo.
            </p>
          </header>

          <ul className="hga-stats">
            {marketStats.map((stat, index) => (
              <ScrollReveal as="li" key={stat.source + stat.value} delay={index * 0.05}>
                  <span className="hga-stat-value">{stat.value}</span>
                  <p className="hga-stat-desc">{stat.desc}</p>
                  <a className="hga-stat-source" href={stat.url} target="_blank" rel="noopener noreferrer">
                    {stat.source} <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
              </ScrollReveal>
            ))}
          </ul>
        </section>

        {/* ---------- Dúvidas ----------
            Respostas curtas para as objeções que travam o primeiro contato. */}
        <section className="hga-section" id="duvidas">
          <header className="hga-head">
            <p className="hga-eyebrow">Dúvidas frequentes</p>
            <h2>Antes de conversar.</h2>
          </header>

          <div className="hga-faq">
            {faq.map((item) => (
              <details key={item.q} className="hga-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
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
                Descreva o cenário em poucas linhas para receber o diagnóstico gratuito. Se der para
                ajudar, a gente responde com um caminho possível; se não for o nosso escopo, a gente diz
                isso direto.
              </p>
              <ul className="hga-contact-channels">
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={16} aria-hidden="true" />
                    Prefere WhatsApp? {HGA_CONTACT.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${HGA_CONTACT.email}`}>
                    <Mail size={16} aria-hidden="true" />
                    {HGA_CONTACT.email}
                  </a>
                </li>
                <li>
                  <MapPin size={16} aria-hidden="true" />
                  {HGA_CONTACT.city}, {HGA_CONTACT.region}
                </li>
              </ul>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
