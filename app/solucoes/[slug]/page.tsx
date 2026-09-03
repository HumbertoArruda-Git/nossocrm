import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { SolutionVisual } from '@/components/landing/SolutionVisual'
import { exo2 } from '@/lib/fonts/exo2'
import { getSolutionBySlug, solutions } from '@/lib/content/solutions'

interface SolutionPageProps {
  params: Promise<{ slug: string }>
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
    alternates: { canonical: `/solucoes/${solution.slug}` },
    openGraph: {
      title,
      description: solution.metaDescription,
      url: `/solucoes/${solution.slug}`,
      siteName: 'HGA Systems',
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: { card: 'summary', title, description: solution.metaDescription },
  }
}

export default async function SolutionPage({ params }: SolutionPageProps) {
  const { slug } = await params
  const solution = getSolutionBySlug(slug)
  if (!solution) notFound()

  const others = solutions.filter((item) => item.slug !== solution.slug)

  return (
    <div className={`hga-site ${exo2.variable}`}>
      <SiteHeader />

      <main>
        <article className="hga-solution-page">
          <div className="hga-solution-hero">
            <Link href="/#solucoes" className="hga-solution-back">
              <ArrowLeft size={14} aria-hidden="true" /> Todas as soluções
            </Link>
            <p className="hga-solution-cat">{solution.category}</p>
            <h1>{solution.title}</h1>
            <p className="hga-solution-lead">{solution.description}</p>
          </div>

          <SolutionVisual name={solution.visual} className="hga-solution-visual" />

          <div className="hga-solution-body">
            <section>
              <h2>O problema que resolve</h2>
              <p>{solution.problem}</p>
            </section>

            <section>
              <h2>Como funciona</h2>
              <p>{solution.how}</p>
            </section>

            <section>
              <h2>Onde costuma se aplicar</h2>
              <ul className="hga-solution-list">
                {solution.examples.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section>
              <h2>O que muda na rotina</h2>
              <ul className="hga-solution-checks">
                {solution.benefits.map((item) => (
                  <li key={item}>
                    <Check size={15} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2>Para quem é indicada</h2>
              <p>{solution.audience}</p>
            </section>

            <div className="hga-solution-cta">
              <Link className="hga-btn hga-btn-primary" href="/#contato">
                Falar sobre isso <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <nav className="hga-solution-others" aria-label="Outras soluções">
            <p className="hga-solution-others-label">Outras soluções</p>
            <div className="hga-solution-others-list">
              {others.map((item) => (
                <Link key={item.slug} href={`/solucoes/${item.slug}`} className="hga-solution-other-link">
                  {item.shortTitle}
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
