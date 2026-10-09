import type { Metadata } from 'next'
import './landing.css'

/**
 * Layout do site público da HGA (home, soluções, privacidade).
 * Carrega só o CSS da landing: sem Tailwind, sem PWA, sem fonte do CRM.
 */
export const metadata: Metadata = {
  manifest: null,
  icons: {
    icon: [
      { url: '/icons/hga.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    ],
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return children
}
