import { Exo_2 } from 'next/font/google'

export const exo2 = Exo_2({
  subsets: ['latin', 'latin-ext'],
  // A assinatura HGA é o único texto em Exo 2 e sai sempre em 800;
  // 600 e 700 eram dois arquivos baixados e nunca usados.
  weight: ['800'],
  variable: '--font-exo2',
  display: 'swap',
})
