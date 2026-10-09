import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SITE_URL } from '@/lib/seo/site'

/*
 * Layout raiz mínimo, compartilhado pelo site público da HGA e pelo CRM.
 *
 * O CSS, o PWA e os ícones de cada lado ficam no layout do próprio grupo:
 *   app/(site)/layout.tsx → landing (home, soluções, privacidade)
 *   app/(crm)/layout.tsx  → CRM (login, convite, instalação, telas internas)
 * Assim a landing não baixa o Tailwind/CSS do CRM, e o CRM não carrega o
 * CSS da landing.
 *
 * A Inter fica aqui porque a variável precisa estar no <body> (os portais do
 * Radix renderizam direto nele). `preload: false` evita que o site público
 * baixe uma fonte que não usa; no CRM ela é carregada pelo próprio CSS.
 */
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', preload: false })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'NossoCRM',
  description: 'CRM Inteligente para Gestão de Vendas',
  // Telas do app (login, convite, instalação, CRM) não devem aparecer na busca do
  // domínio da HGA. As páginas públicas (home, soluções, privacidade) reabrem
  // a indexação explicitamente no próprio metadata.
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: necessário porque a classe "dark" é aplicada no servidor mas pode ser sobrescrita por tema do sistema no cliente
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[var(--color-bg)] text-[var(--color-text-primary)]`}>
        {children}
      </body>
    </html>
  )
}
