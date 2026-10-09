import type { Metadata } from 'next'
import '../globals.css'
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister'
import { InstallBanner } from '@/components/pwa/InstallBanner'

/**
 * Layout do CRM: Tailwind (globals.css), PWA e ícone do NossoCRM.
 * Nada disso chega ao site público da HGA, que tem o próprio layout em (site).
 */
export const metadata: Metadata = {
  icons: { icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }] },
}

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegister />
      <InstallBanner />
      {children}
    </>
  )
}
