import {
  ArrowRight,
  Check,
} from 'lucide-react'
import type { Metadata } from 'next'
import { Exo_2 } from 'next/font/google'
import { CapabilityFlow } from '@/components/landing/CapabilityFlow'
import { HeroFragments } from '@/components/landing/HeroFragments'
import { HgaMobileMenu } from '@/components/landing/HgaMobileMenu'
import { ServiceRow } from '@/components/landing/ServiceRow'

const exo2 = Exo_2({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  variable: '--font-exo2',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HGA Systems | Tecnologia para organizar, automatizar e crescer',
  description: 'Automação, CRM, inteligência artificial e sistemas sob medida para sua empresa.',
}

const services = [
  { category: 'AUTOMAÇÃO', title: 'Automação de Processos', description: 'Processos repetitivos ocupam tempo que poderia estar em decisões estratégicas. Mapeamos e automatizamos essas rotinas, liberando a equipe para o trabalho que realmente exige atenção humana.' },
  { category: 'CRM / SISTEMAS', title: 'CRM e Gestão Comercial', description: 'Sem um lugar único para acompanhar oportunidades, informações comerciais se perdem entre conversas e planilhas. Um CRM bem estruturado organiza esse fluxo e deixa claro qual é o próximo passo de cada negociação.' },
  { category: 'IA APLICADA', title: 'Inteligência Artificial Aplicada', description: 'Nem toda etapa comercial precisa esperar disponibilidade humana. Aplicamos IA nos pontos certos do processo — triagem, resposta inicial, apoio à análise — para tornar a operação mais ágil sem perder controle.' },
  { category: 'SOFTWARE', title: 'Sistemas Sob Medida', description: 'Ferramentas genéricas nem sempre acompanham a forma como o negócio realmente funciona. Construímos sistemas desenhados para o seu fluxo específico, em vez de adaptar o negócio a um software pronto.' },
  { category: 'INTEGRAÇÕES', title: 'Integração entre Ferramentas', description: 'Sistemas que não conversam entre si geram retrabalho e dados desencontrados. Conectamos as ferramentas que sua empresa já usa para que a informação circule automaticamente entre elas.' },
  { category: 'WEB', title: 'Sites e Landing Pages', description: 'Uma presença digital confusa afasta quem já está interessado. Criamos sites e landing pages claros e diretos, pensados para transformar visita em oportunidade real.' },
]

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

const differentiators = ['Tecnologia aplicada ao problema real', 'Soluções personalizadas', 'Automação com foco em resultado', 'Integração entre sistemas', 'Visão de negócio + tecnologia', 'Evolução contínua']

export default function HomePage() {
  return (
    <div className={`hga-site ${exo2.variable}`}>
      <header className="hga-header">
        <a className="hga-wordmark" href="#inicio" aria-label="HGA Systems — início"><span className="hga-wordmark-name"><b>H</b><b>G</b><b className="hga-wordmark-a">A</b></span><small>SYSTEMS</small></a>
        <nav className="hga-nav" aria-label="Navegação principal">
          <a href="#solucoes">Soluções</a><a href="#capacidade">Sistemas</a><a href="#processo">Processo</a>
        </nav>
        <a className="hga-header-cta" href="#solucoes">Conhecer soluções</a>
        <HgaMobileMenu />
      </header>

      <main>
        <section className="hga-hero" id="inicio">
          <div className="hga-hero-bg" aria-hidden="true" />
          <div className="hga-hero-copy">
            <p className="hga-eyebrow">Automação · CRM · Inteligência Artificial · Sistemas sob medida</p>
            <h1>Tecnologia para organizar, automatizar e crescer.</h1>
            <p className="hga-lede">A HGA Systems ajuda empresas a organizar processos, ganhar produtividade e melhorar resultados com tecnologia prática e eficiente.</p>
            <div className="hga-actions"><a className="hga-button hga-button-primary" href="#solucoes">Conhecer soluções <ArrowRight size={17} /></a></div>
          </div>
          <HeroFragments />
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
            <p>Do primeiro diagnóstico à evolução contínua, criamos soluções para tornar sua operação mais clara, integrada e eficiente.</p>
          </div>
          <div className="hga-service-list">
            {services.map((service) => <ServiceRow key={service.title} {...service} />)}
          </div>
        </section>

        <section className="hga-capability" id="capacidade">
          <div className="hga-capability-copy">
            <p className="hga-eyebrow">Capacidade técnica</p>
            <h2>Sistemas conectados, pensados para a operação real.</h2>
            <p>Da entrada de um dado até a decisão final, projetamos fluxos que conectam sistemas, pessoas e automações sem perder contexto.</p>
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

        <section className="hga-section hga-differentials"><div><p className="hga-eyebrow">Por que a HGA</p><h2>Construímos para o contexto real da sua empresa.</h2></div><div className="hga-diff-list">{differentiators.map((item) => <div key={item}><Check size={17} /> {item}</div>)}</div></section>

        <section className="hga-contact" id="contato"><div className="hga-contact-copy"><p className="hga-eyebrow">Vamos conversar</p><h2>Sua empresa não precisa trabalhar mais. Precisa trabalhar melhor.</h2><p>Conte um pouco sobre o desafio atual. A HGA Systems pode ajudar a encontrar um caminho mais simples, conectado e eficiente.</p></div><form className="hga-form"><div className="hga-form-row"><label>Nome<input name="name" placeholder="Seu nome" /></label><label>Empresa<input name="company" placeholder="Nome da empresa" /></label></div><div className="hga-form-row"><label>E-mail<input type="email" name="email" placeholder="voce@empresa.com" /></label><label>Telefone <small>(opcional)</small><input name="phone" placeholder="(00) 00000-0000" /></label></div><label>Mensagem<textarea name="message" rows={4} placeholder="Qual desafio você quer resolver?" /></label><button className="hga-submit" type="submit" disabled>Envio será habilitado em breve <ArrowRight size={16} /></button></form></section>
      </main>

      <footer className="hga-footer"><a className="hga-wordmark" href="#inicio"><span className="hga-wordmark-name"><b>H</b><b>G</b><b className="hga-wordmark-a">A</b></span><small>SYSTEMS</small></a><span>hgasystems.com.br</span><span>© HGA Systems</span></footer>
    </div>
  )
}
