import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  CircuitBoard,
  Database,
  Layers3,
  Link2,
  Mail,
  PenTool,
  Rocket,
  Workflow,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HGA Systems | Tecnologia para organizar, automatizar e crescer',
  description: 'Automação, CRM, inteligência artificial e sistemas sob medida para sua empresa.',
}

const services = [
  { icon: Workflow, title: 'Automação de Processos', text: 'Reduza tarefas repetitivas e libere seu time para o que realmente movimenta o negócio.' },
  { icon: Layers3, title: 'CRM e Gestão Comercial', text: 'Tenha uma operação comercial organizada, com contexto e próximos passos sempre claros.' },
  { icon: Bot, title: 'Inteligência Artificial Aplicada', text: 'Use IA onde ela gera valor: decisões mais rápidas, atendimento melhor e operações mais inteligentes.' },
  { icon: CircuitBoard, title: 'Sistemas Sob Medida', text: 'Construa a solução certa para o seu fluxo, sem forçar o negócio a caber em uma ferramenta genérica.' },
  { icon: Link2, title: 'Integração entre Ferramentas', text: 'Faça seus sistemas conversarem para eliminar retrabalho e manter a informação no lugar certo.' },
  { icon: PenTool, title: 'Sites e Landing Pages', text: 'Transforme sua presença digital em uma experiência clara, rápida e preparada para gerar oportunidades.' },
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
    <main className="hga-site">
      <header className="hga-header">
        <a className="hga-wordmark" href="#inicio" aria-label="HGA Systems — início"><span>HGA</span> Systems</a>
        <nav className="hga-nav" aria-label="Navegação principal">
          <a href="#servicos">Serviços</a><a href="#solucoes">Soluções</a><a href="#processo">Como trabalhamos</a><a href="#contato">Contato</a>
        </nav>
        <a className="hga-header-cta" href="#contato">Falar com a HGA <ArrowRight size={16} /></a>
      </header>

      <section className="hga-hero" id="inicio">
        <div className="hga-hero-copy">
          <p className="hga-eyebrow"><span className="hga-status-dot" /> Tecnologia para organizar, automatizar e crescer.</p>
          <h1>Automação, CRM, inteligência artificial e <em>sistemas sob medida</em> para sua empresa.</h1>
          <p className="hga-lede">A HGA Systems ajuda empresas a organizar processos, ganhar produtividade e melhorar resultados com tecnologia prática e eficiente.</p>
          <div className="hga-actions"><a className="hga-button hga-button-primary" href="#contato">Solicitar diagnóstico <ArrowRight size={17} /></a><a className="hga-button hga-button-quiet" href="#servicos">Conhecer soluções <ChevronDown size={16} /></a></div>
        </div>
        <div className="hga-hero-visual" aria-label="Visualização abstrata de sistemas conectados">
          <div className="hga-orbit orbit-one" /><div className="hga-orbit orbit-two" /><div className="hga-orbit orbit-three" />
          <div className="hga-core"><span className="hga-core-mark">H</span><span>HGA <b>SYSTEMS</b></span></div>
          <div className="hga-node node-top"><Database size={15} /><span>dados</span></div><div className="hga-node node-right"><Bot size={15} /><span>inteligência</span></div><div className="hga-node node-bottom"><Rocket size={15} /><span>crescimento</span></div><div className="hga-node node-left"><Workflow size={15} /><span>fluxos</span></div>
          <div className="hga-visual-caption"><span className="hga-live-dot" /> sistemas conectados <span>·</span> operação em movimento</div>
        </div>
      </section>

      <section className="hga-section hga-services" id="servicos"><div className="hga-section-intro"><p className="hga-eyebrow">O que fazemos</p><h2>Tecnologia que trabalha a favor do seu negócio.</h2><p>Do primeiro diagnóstico à evolução contínua, criamos soluções para tornar sua operação mais clara, integrada e eficiente.</p></div><div className="hga-service-grid">{services.map(({ icon: Icon, title, text }) => <article className="hga-service-card" key={title}><div className="hga-icon"><Icon size={20} /></div><h3>{title}</h3><p>{text}</p><ArrowRight className="hga-card-arrow" size={17} /></article>)}</div></section>

      <section className="hga-section hga-problems" id="solucoes"><div className="hga-problem-heading"><p className="hga-eyebrow">Menos atrito. Mais clareza.</p><h2>O que está impedindo sua operação de avançar?</h2><p>Nem todo problema precisa de mais uma ferramenta. Às vezes, ele precisa de uma visão melhor do todo.</p></div><div className="hga-pain-list">{painPoints.map((point) => <div key={point}><Check size={16} />{point}</div>)}</div></section>

      <section className="hga-section hga-process" id="processo"><div className="hga-section-intro"><p className="hga-eyebrow">Como trabalhamos</p><h2>Clareza antes. Resultado depois.</h2><p>Uma abordagem próxima e objetiva para transformar complexidade em próximos passos possíveis.</p></div><div className="hga-steps">{steps.map(([number, title, text], index) => <article key={number} className="hga-step"><span className="hga-step-number">{number}</span><div className="hga-step-line">{index < steps.length - 1 && <span />}</div><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="hga-section hga-differentials"><div><p className="hga-eyebrow">Por que a HGA</p><h2>Construímos para o contexto real da sua empresa.</h2></div><div className="hga-diff-list">{differentiators.map((item) => <div key={item}><Check size={17} /> {item}</div>)}</div></section>

      <section className="hga-contact" id="contato"><div className="hga-contact-copy"><p className="hga-eyebrow">Vamos conversar</p><h2>Sua empresa não precisa trabalhar mais. Precisa trabalhar melhor.</h2><p>Conte um pouco sobre o desafio atual. A HGA Systems pode ajudar a encontrar um caminho mais simples, conectado e eficiente.</p><a className="hga-contact-email" href="mailto:contato@hgasystems.com.br"><Mail size={17} /> contato@hgasystems.com.br</a></div><form className="hga-form" onSubmit={(event) => event.preventDefault()}><div className="hga-form-row"><label>Nome<input name="name" placeholder="Seu nome" /></label><label>Empresa<input name="company" placeholder="Nome da empresa" /></label></div><div className="hga-form-row"><label>E-mail<input type="email" name="email" placeholder="voce@empresa.com" /></label><label>Telefone <small>(opcional)</small><input name="phone" placeholder="(00) 00000-0000" /></label></div><label>Mensagem<textarea name="message" rows={4} placeholder="Qual desafio você quer resolver?" /></label><button className="hga-submit" type="submit" disabled>Envio será habilitado em breve <ArrowRight size={16} /></button></form></section>

      <footer className="hga-footer"><a className="hga-wordmark" href="#inicio"><span>HGA</span> Systems</a><span>hgasystems.com.br</span><span>© HGA Systems</span></footer>
    </main>
  )
}
