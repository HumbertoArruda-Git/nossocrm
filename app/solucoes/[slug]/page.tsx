import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SiteHeader } from '@/components/landing/SiteHeader'
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
    alternates: {
      canonical: `/solucoes/${solution.slug}`,
    },
    openGraph: {
      title,
      description: solution.metaDescription,
      url: `/solucoes/${solution.slug}`,
      siteName: 'HGA Systems',
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description: solution.metaDescription,
    },
  }
}

export default async function SolutionPage({ params }: SolutionPageProps) {
  const { slug } = await params
  const solution = getSolutionBySlug(slug)
  if (!solution) notFound()

  return (
    <div className={`hga-site ${exo2.variable}`}>
      <SiteHeader />

      <main>
        <section className="hga-section">
          <div className="hga-solution-hero">
            <Link href="/#solucoes" className="hga-solution-back">
              <ArrowLeft size={13} aria-hidden="true" /> Todas as soluções
            </Link>
            <p className="hga-eyebrow">{solution.category}</p>
            <h1>{solution.title}</h1>
            <p className="hga-lede">{solution.description}</p>
          </div>

          <div className="hga-solution-body">
            <div>
              <h2>O que inclui</h2>
              <ul className="hga-capability-list">
                {solution.includes.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div>
              <h2>Para quem é indicado</h2>
              <p>{solution.audience}</p>
            </div>

            <div className="hga-solution-cta">
              <Link className="hga-button hga-button-primary" href="/#contato">
                Falar sobre {solution.title.toLowerCase()} <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
