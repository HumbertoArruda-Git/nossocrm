export const SITE_URL = 'https://hgasystems.com.br'

/**
 * Dados públicos da HGA. Só entra aqui o que o responsável confirmou:
 * sem CNPJ, endereço completo, cases ou preços enquanto não existirem.
 */
export const HGA_CONTACT = {
  email: 'hgasystems.comercial@gmail.com',
  phoneDisplay: '(11) 92543-7676',
  phoneE164: '+5511925437676',
  city: 'São Paulo',
  region: 'SP',
} as const

const WHATSAPP_GREETING = 'Olá! Vim pelo site da HGA e quero conversar sobre um projeto.'

export const WHATSAPP_URL = `https://wa.me/${HGA_CONTACT.phoneE164.slice(1)}?text=${encodeURIComponent(WHATSAPP_GREETING)}`
