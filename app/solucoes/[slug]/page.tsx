import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { SolutionVisual } from '@/components/landing/SolutionVisual'
import { exo2 } from '@/lib/fonts/exo2'
import { archivo, plexMono } from '@/lib/fonts/landing'
import { getSolutionBySlug, solutions } from '@/lib/content/solutions'

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

  const title = `${solution.title} | HGA Systems`

  return {
    title,
    description: solution.metaDescription,
    manifest: null,
    icons: { icon: [{ url: '/icons/hga.svg', type: 'image/svg+xml' }] },
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

  return (
    <div className={`hga-site ${exo2.variable} ${archivo.variable} ${plexMono.variable}`}>
      <SiteHeader />

      <main>
        <article className="hga-solution-page">
          {/* Mesma luz da home, em escala menor e contida na dobra: a página
              de solução é um capítulo, não uma abertura. */}
          <div className="hga-solution-light" aria-hidden="true">
            <span className="hga-solution-beam" />
            <span className="hga-solution-arc" />
          </div>

          {/* Duas colunas: a tese à esquerda, a miniatura viva à direita —
              a mesma que o visitante clicou no cartão da home, agora grande. */}
          <div className="hga-solution-top">
            <div className="hga-solution-hero">
              <Link href="/#solucoes" className="hga-solution-back">
                <ArrowLeft size={14} aria-hidden="true" /> Todas as soluções
              </Link>
              <p className="hga-solution-cat">{solution.category}</p>
              <h1>{solution.title}</h1>
              <p className="hga-solution-lead">{solution.description}</p>
            </div>

            <SolutionVisual name={solution.visual} className="hga-solution-visual" />
          </div>

          <div className="hga-solution-body">
            <section className="hga-solution-block">
              <h2>O problema que resolve</h2>
              <p>{solution.problem}</p>
            </section>

            <section className="hga-solution-block">
              <h2>Como funciona</h2>
              <p>{solution.how}</p>
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
          </div>

          <div className="hga-solution-cta">
            <Link className="hga-btn hga-btn-primary" href="/#contato">
              Falar sobre isso <ArrowRight size={16} aria-hidden="true" />
            </Link>
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
