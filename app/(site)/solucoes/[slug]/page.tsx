import { ArrowLeft, ArrowRight, Check, MessageCircle } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { AnchorScroll } from '@/components/landing/AnchorScroll'
import { SolutionShowcase } from '@/components/landing/SolutionShowcase'
import { exo2 } from '@/lib/fonts/exo2'
import { archivo, plexMono } from '@/lib/fonts/landing'
import { getSolutionBySlug, solutions } from '@/lib/content/solutions'
import { processSteps } from '@/lib/content/process'
import { JsonLd } from '@/components/landing/JsonLd'
import { breadcrumbJsonLd, faqJsonLd, organizationJsonLd, serviceJsonLd } from '@/lib/seo/jsonld'
import { WHATSAPP_URL } from '@/lib/seo/site'

interface SolutionPageProps {
  params: Promise<{ slug: string }>
}

export const viewport: Viewport = {
  themeColor: '#04060C',
}

export function generateStaticParams() {
  return solutions.map((solution) => ({ slug: solution.slug }))
}

export async function generateMetadata({ params }: SolutionPageProps): Promise<Metadata> {
  const { slug } = await params
  const solution = getSolutionBySlug(slug)
  if (!solution) return {}

  const title = solution.seoTitle

  return {
    title,
    description: solution.metaDescription,
    robots: { index: true, follow: true },
    alternates: { canonical: `/solucoes/${solution.slug}` },
    openGraph: {
      title,
      description: solution.metaDescription,
      url: `/solucoes/${solution.slug}`,
      images: [{ url: `/api/og?slug=${solution.slug}`, width: 1200, height: 630, alt: title }],
      siteName: 'HGA Systems',
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: solution.metaDescription,
      images: [`/api/og?slug=${solution.slug}`],
    },
  }
}

export default async function SolutionPage({ params }: SolutionPageProps) {
  const { slug } = await params
  const solution = getSolutionBySlug(slug)
  if (!solution) notFound()

  const others = solutions.filter((item) => item.slug !== solution.slug)
  // o formulário da home lê ?assunto= e já marca o assunto desta página
  const contactHref = `/?assunto=${solution.contactSubject}#contato`

  return (
    <div className={`hga-site ${exo2.variable} ${archivo.variable} ${plexMono.variable}`}>
      <JsonLd
        nodes={[
          organizationJsonLd(),
          serviceJsonLd(solution),
          breadcrumbJsonLd([
            { name: 'Início', path: '/' },
            { name: 'Soluções', path: '/#solucoes' },
            { name: solution.title, path: `/solucoes/${solution.slug}` },
          ]),
          faqJsonLd(solution.faq),
        ]}
      />
      <AnchorScroll />
      <SiteHeader />

      <main>
        <article className="hga-solution-page">
          {/* Mesma luz da home, em escala menor e contida na dobra: a página
              de solução é um capítulo, não uma abertura. */}
          <div className="hga-solution-light" aria-hidden="true">
            <span className="hga-solution-beam" />
            <span className="hga-solution-arc" />
          </div>

          {/* A tese, e logo abaixo o artefato em largura cheia — a mesma
              ordem da home: primeiro o que é, depois a prova rodando. */}
          <div className="hga-solution-top">
            <Link href="/#solucoes" className="hga-solution-back">
              <ArrowLeft size={14} aria-hidden="true" /> Todas as soluções
            </Link>
            <div className="hga-solution-hero">
              <p className="hga-solution-cat">{solution.category}</p>
              <h1>{solution.title}</h1>
              <p className="hga-solution-lead">{solution.description}</p>
            </div>
          </div>

          <SolutionShowcase name={solution.visual} />

          {/* Ficha técnica: rótulo à esquerda, conteúdo à direita. A ordem
              segue a pergunta de quem lê: qual é o problema, como resolve,
              como fica na prática, o que recebo, com o que conecta. */}
          <div className="hga-solution-body">
            <section className="hga-solution-block">
              <h2>O problema que resolve</h2>
              <div className="hga-solution-prose">
                {solution.problem.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>

            <section className="hga-solution-block">
              <h2>Como funciona</h2>
              <div className="hga-solution-prose">
                {solution.how.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>

            <section className="hga-solution-block">
              <h2>Na prática</h2>
              <div>
                <p className="hga-solution-scenario-title">
                  {solution.scenario.title}
                  <span className="hga-solution-tag">Exemplo ilustrativo</span>
                </p>
                <div className="hga-solution-scenario">
                  <div>
                    <p className="hga-solution-scenario-label">Hoje</p>
                    <p>{solution.scenario.before}</p>
                  </div>
                  <div className="hga-solution-scenario-after">
                    <p className="hga-solution-scenario-label">Depois</p>
                    <p>{solution.scenario.after}</p>
                  </div>
                </div>
                <Link className="hga-solution-inline-cta" href={contactHref}>
                  Tem uma rotina parecida? Peça o diagnóstico gratuito
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </section>

            <section className="hga-solution-block">
              <h2>O que é entregue</h2>
              <ul className="hga-solution-checks">
                {solution.deliverables.map((item) => (
                  <li key={item}>
                    <span className="hga-solution-check" aria-hidden="true">
                      <Check size={12} strokeWidth={2.4} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="hga-solution-block">
              <h2>Com o que conecta</h2>
              <ul className="hga-solution-chips">
                {solution.connects.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="hga-solution-block">
              <h2>Onde costuma se aplicar</h2>
              <ul className="hga-solution-list">
                {solution.examples.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="hga-solution-block">
              <h2>O que muda na rotina</h2>
              <ul className="hga-solution-checks">
                {solution.benefits.map((item) => (
                  <li key={item}>
                    <span className="hga-solution-check" aria-hidden="true">
                      <Check size={12} strokeWidth={2.4} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="hga-solution-block">
              <h2>Para quem é indicada</h2>
              <p>{solution.audience}</p>
            </section>

            <section className="hga-solution-block">
              <h2>Como começa</h2>
              <ol className="hga-solution-steps">
                {processSteps.map((step) => (
                  <li key={step.n}>
                    <span className="hga-solution-step-n">{step.n}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="hga-solution-block">
              <h2>Perguntas frequentes</h2>
              <div className="hga-faq">
                {solution.faq.map((item) => (
                  <details key={item.q} className="hga-faq-item">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <div className="hga-solution-cta">
            <Link className="hga-btn hga-btn-primary" href={contactHref}>
              Pedir diagnóstico gratuito <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a className="hga-btn hga-btn-ghost" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} aria-hidden="true" /> Falar no WhatsApp
            </a>
          </div>

          <nav className="hga-solution-others" aria-label="Outras soluções">
            <p className="hga-solution-others-label">Outras soluções</p>
            <div className="hga-solution-others-list">
              {others.map((item) => (
                <Link key={item.slug} href={`/solucoes/${item.slug}`} className="hga-solution-other-link">
                  {item.shortTitle}
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </nav>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
