import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { CapabilityFlow } from '@/components/landing/CapabilityFlow'
import { ServiceRow } from '@/components/landing/ServiceRow'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { exo2 } from '@/lib/fonts/exo2'
import { solutions } from '@/lib/content/solutions'

export const metadata: Metadata = {
  title: 'HGA Systems | Tecnologia para organizar, automatizar e crescer',
  description: 'Automação, CRM, inteligência artificial e sistemas sob medida para sua empresa.',
  manifest: null,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HGA Systems | Tecnologia para organizar, automatizar e crescer',
    description: 'Automação, CRM, inteligência artificial e sistemas sob medida para sua empresa.',
    url: '/',
    siteName: 'HGA Systems',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'HGA Systems | Tecnologia para organizar, automatizar e crescer',
    description: 'Automação, CRM, inteligência artificial e sistemas sob medida para sua empresa.',
  },
}

const capabilities = [
  'Processos conectados de ponta a ponta',
  'Dados disponíveis no contexto certo',
  'Automações integradas à operação',
  'IA aplicada onde existe decisão ou análise',
]

const painPoints = [
  'Tarefas manuais consumindo tempo',
  'Leads sem acompanhamento',
  'Informações espalhadas',
  'Processos dependentes demais de pessoas',
  'Ferramentas que não conversam entre si',
  'Falta de visibilidade comercial',
  'Uma operação que não escala',
]

const steps = [
  ['01', 'Diagnóstico', 'Entendemos o cenário, os gargalos e as oportunidades reais do seu negócio.'],
  ['02', 'Estratégia', 'Desenhamos uma direção objetiva, priorizando impacto e viabilidade.'],
  ['03', 'Implementação', 'Colocamos a solução em prática com clareza, proximidade e foco.'],
  ['04', 'Evolução', 'Acompanhamos o uso e melhoramos continuamente o que foi construído.'],
]

const differentiators = [
  { title: 'Tecnologia aplicada ao problema real', text: 'Cada solução nasce de um problema específico, não de um catálogo pronto.' },
  { title: 'Soluções personalizadas', text: 'Construímos para o seu fluxo, não para um caso médio de mercado.' },
  { title: 'Automação orientada a resultado', text: 'Automatizar só faz sentido quando muda o que a operação entrega.' },
  { title: 'Integração entre sistemas', text: 'Suas ferramentas passam a conversar entre si, sem retrabalho.' },
  { title: 'Visão de negócio + tecnologia', text: 'Tecnologia certa parte do contexto do negócio, não do contrário.' },
  { title: 'Evolução contínua', text: 'O trabalho não termina na entrega — acompanhamos o uso e ajustamos.' },
]

export default function HomePage() {
  return (
    <div className={`hga-site ${exo2.variable}`}>
      <SiteHeader />

      <main>
        <section className="hga-hero" id="inicio">
          <div className="hga-hero-bg" aria-hidden="true" />
          <div className="hga-hero-copy">
            <p className="hga-eyebrow">Automação · CRM · Inteligência Artificial · Sistemas sob medida</p>
            <h1>Tecnologia para organizar, automatizar e crescer.</h1>
            <p className="hga-lede">A HGA Systems ajuda empresas a organizar processos, ganhar produtividade e melhorar resultados com tecnologia prática e eficiente.</p>
            <div className="hga-actions"><a className="hga-button hga-button-primary" href="#solucoes">Conhecer soluções <ArrowRight size={17} aria-hidden="true" /></a></div>
          </div>
        </section>

        <section className="hga-problems" id="problemas">
          <div className="hga-problem-heading">
            <p className="hga-eyebrow">Menos atrito. Mais clareza.</p>
            <h2>O que está impedindo sua operação de avançar?</h2>
            <p>Nem todo problema precisa de mais uma ferramenta. Às vezes, ele precisa de uma visão melhor do todo.</p>
          </div>
          <ul className="hga-pain-list">
            {painPoints.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </section>

        <section className="hga-section hga-solutions" id="solucoes">
          <div className="hga-section-intro">
            <p className="hga-eyebrow">O que fazemos</p>
            <h2>Tecnologia que trabalha a favor do seu negócio.</h2>
            <p>Do primeiro diagnóstico à evolução contínua, criamos soluções para tornar sua operação mais clara, integrada e eficiente. Toque em uma solução para conhecer os detalhes.</p>
          </div>
          <div className="hga-service-list">
            {solutions.map((solution) => (
              <ServiceRow
                key={solution.slug}
                slug={solution.slug}
                category={solution.category}
                title={solution.title}
                description={solution.description}
              />
            ))}
          </div>
        </section>

        <section className="hga-capability" id="capacidade">
          <div className="hga-capability-copy">
            <p className="hga-eyebrow">Capacidade técnica</p>
            <h2>Sistemas conectados, pensados para a operação real.</h2>
            <p>Da entrada de um dado até a decisão final, projetamos fluxos que conectam sistemas, pessoas e automações sem perder contexto. Toque em cada etapa para entender o que ela faz.</p>
            <ul className="hga-capability-list">
              {capabilities.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <CapabilityFlow />
        </section>

        <section className="hga-section hga-process" id="processo">
          <div className="hga-section-intro">
            <p className="hga-eyebrow">Como trabalhamos</p>
            <h2>Clareza antes. Resultado depois.</h2>
            <p>Uma abordagem próxima e objetiva para transformar complexidade em próximos passos possíveis.</p>
          </div>
          <div className="hga-steps">
            {steps.map(([number, title, text]) => (
              <article className="hga-step" key={number}>
                <div className="hga-step-marker">
                  <span className="hga-step-number">{number}</span>
                </div>
                <div className="hga-step-body">
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hga-differentials">
          <div className="hga-differentials-intro">
            <p className="hga-eyebrow">Por que a HGA</p>
            <h2>Construímos para o contexto real da sua empresa.</h2>
          </div>
          <ul className="hga-diff-list">
            {differentiators.map((item) => (
              <li key={item.title}>
                <span className="hga-diff-title">{item.title}</span>
                <span className="hga-diff-desc">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="hga-contact" id="contato">
          <div className="hga-contact-copy">
            <p className="hga-eyebrow">Vamos conversar</p>
            <h2>Sua empresa não precisa trabalhar mais. Precisa trabalhar melhor.</h2>
            <p>Conte um pouco sobre o desafio atual. A HGA Systems pode ajudar a encontrar um caminho mais simples, conectado e eficiente.</p>
          </div>
          <form className="hga-form">
            <div className="hga-form-row">
              <label>Nome<input name="name" autoComplete="name" placeholder="Seu nome" /></label>
              <label>Empresa<input name="company" autoComplete="organization" placeholder="Nome da empresa" /></label>
            </div>
            <div className="hga-form-row">
              <label>E-mail<input type="email" name="email" autoComplete="email" placeholder="voce@empresa.com" /></label>
              <label>Telefone <small>(opcional)</small><input type="tel" name="phone" autoComplete="tel" placeholder="(00) 00000-0000" /></label>
            </div>
            <label>Mensagem<textarea name="message" rows={4} placeholder="Qual desafio você quer resolver?" /></label>
            <button className="hga-submit" type="submit" disabled>Formulário em preparação</button>
          </form>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
