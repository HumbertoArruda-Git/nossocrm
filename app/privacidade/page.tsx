import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { AnchorScroll } from '@/components/landing/AnchorScroll'
import { exo2 } from '@/lib/fonts/exo2'
import { archivo, plexMono } from '@/lib/fonts/landing'

export const viewport: Viewport = {
  themeColor: '#04060C',
}

export const metadata: Metadata = {
  title: 'Aviso de privacidade | HGA Systems',
  description: 'Quais dados o formulário de contato da HGA Systems coleta, para que são usados, por quanto tempo ficam guardados e como pedir acesso ou exclusão.',
  manifest: null,
  icons: { icon: [{ url: '/icons/hga.svg', type: 'image/svg+xml' }] },
  alternates: { canonical: '/privacidade' },
  openGraph: {
    title: 'Aviso de privacidade | HGA Systems',
    description: 'Como a HGA Systems trata os dados enviados pelo formulário de contato.',
    url: '/privacidade',
    siteName: 'HGA Systems',
    locale: 'pt_BR',
    type: 'website',
  },
}

/**
 * O formulário de contato afirmava tratar os dados "seguindo boas práticas de
 * privacidade e a LGPD" sem nada por trás: nenhum lugar dizia o que é coletado,
 * por quanto tempo fica, com quem é compartilhado ou como pedir exclusão.
 * Esta página é esse lugar, e cada afirmação abaixo corresponde ao que o código
 * realmente faz — não a um texto genérico de modelo.
 */
export default function PrivacyPage() {
  return (
    <div className={`hga-site ${exo2.variable} ${archivo.variable} ${plexMono.variable}`}>
      <AnchorScroll />
      <SiteHeader />

      <main>
        <article className="hga-solution-page">
          <div className="hga-solution-light" aria-hidden="true">
            <span className="hga-solution-beam" />
            <span className="hga-solution-arc" />
          </div>

          <div className="hga-solution-top">
            <Link href="/#contato" className="hga-solution-back">
              <ArrowLeft size={14} aria-hidden="true" /> Voltar ao contato
            </Link>
            <div className="hga-solution-hero">
              <p className="hga-solution-cat">Privacidade</p>
              <h1>Como tratamos seus dados</h1>
              <p className="hga-solution-lead">
                Este aviso descreve o que acontece com as informações enviadas pelo formulário
                de contato do site da HGA Systems.
              </p>
            </div>
          </div>

          <div className="hga-solution-body">
            <section className="hga-solution-block">
              <h2>O que coletamos</h2>
              <ul className="hga-solution-list">
                <li>Nome e e-mail — obrigatórios, porque são o mínimo para responder.</li>
                <li>Empresa e WhatsApp — opcionais; o formulário funciona sem eles.</li>
                <li>Assunto e a mensagem que você escreve.</li>
                <li>A página do site de onde o envio partiu e a data e hora do envio.</li>
                <li>
                  Um identificador derivado do seu endereço IP, usado apenas para limitar envios
                  repetidos em sequência. Ele é gravado como código embaralhado por uma chave
                  secreta: o endereço original não é armazenado nem pode ser reconstruído a
                  partir dele.
                </li>
              </ul>
            </section>

            <section className="hga-solution-block">
              <h2>Para que usamos</h2>
              <p>
                Para responder ao seu contato e conduzir a conversa comercial que ele inicia.
                Na prática, a mensagem gera um registro de contato, uma oportunidade e uma
                anotação no nosso próprio CRM, e dispara um aviso por e-mail para a equipe.
                Não usamos esses dados para publicidade, não os vendemos e não os cedemos para
                terceiros com finalidade comercial.
              </p>
            </section>

            <section className="hga-solution-block">
              <h2>Base legal</h2>
              <p>
                O tratamento se apoia no artigo 7º da LGPD: os dados são necessários para os
                procedimentos preliminares de uma relação comercial solicitada por você, e o
                registro do contato atende ao legítimo interesse de conduzir e acompanhar essa
                conversa. Você não precisa aceitar nenhum termo adicional para nos escrever —
                mas também não precisa nos escrever para navegar no site.
              </p>
            </section>

            <section className="hga-solution-block">
              <h2>Com quem compartilhamos</h2>
              <p>
                Apenas com os prestadores de infraestrutura necessários para o site funcionar:
                Supabase (banco de dados), Resend (envio do e-mail de aviso interno) e Vercel
                (hospedagem). Eles processam os dados por nossa conta e para as finalidades
                acima. Fora isso, o acesso é da equipe da HGA Systems.
              </p>
            </section>

            <section className="hga-solution-block">
              <h2>Por quanto tempo guardamos</h2>
              <p>
                O registro bruto da submissão — nome, e-mail, telefone, empresa e o texto da
                mensagem — é apagado automaticamente 7 dias depois de processado; o que
                permanece é apenas o registro técnico do envio, sem dados pessoais. As
                informações que passaram para o nosso CRM ficam enquanto durar o relacionamento
                comercial, e são removidas a pedido.
              </p>
            </section>

            <section className="hga-solution-block">
              <h2>Cookies e medição</h2>
              <p>
                Este site não usa cookies de rastreamento, nem ferramentas de analytics ou de
                publicidade de terceiros. O sistema HGA, na área que exige login, usa apenas os
                cookies estritamente necessários para manter a sessão de quem entrou.
              </p>
            </section>

            <section className="hga-solution-block">
              <h2>Seus direitos</h2>
              <p>
                A LGPD garante a você, entre outros, o direito de confirmar que tratamos seus
                dados, acessá-los, corrigi-los, pedir a exclusão e revogar consentimento. Para
                exercer qualquer um deles, envie um pedido pelo próprio formulário de contato
                escolhendo o assunto &ldquo;Outro assunto&rdquo; e descrevendo o que precisa;
                respondemos ao e-mail informado. Retornamos em até 15 dias.
              </p>
            </section>

            <section className="hga-solution-block">
              <h2>Mudanças neste aviso</h2>
              <p>
                Se o tratamento mudar, este texto muda junto. Última atualização: setembro de 2026.
              </p>
            </section>
          </div>

          <div className="hga-solution-cta">
            <Link className="hga-btn hga-btn-primary" href="/#contato">
              Voltar ao formulário <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
