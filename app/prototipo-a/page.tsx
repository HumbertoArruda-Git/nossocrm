import type { Metadata } from 'next'
import HomePage from '@/app/page'
import './dir-a.css'

/**
 * PROTÓTIPO TEMPORÁRIO — direção visual A aplicada sobre a home atual.
 * Mesmo conteúdo, só o CSS de `dir-a.css` por cima. Remover antes do merge.
 */
export const metadata: Metadata = {
  title: 'Protótipo A | HGA Systems',
  robots: { index: false, follow: false },
}

export default function PrototypeAPage() {
  return (
    <div className="hga-dir-a" data-motion="once">
      <HomePage />
    </div>
  )
}
