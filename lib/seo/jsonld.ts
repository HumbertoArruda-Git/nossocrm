import { HGA_CONTACT, SITE_URL } from '@/lib/seo/site'

/** Identificador estável da organização, referenciado pelos outros nós. */
export const ORG_ID = `${SITE_URL}/#organization`

export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'HGA Systems',
    url: SITE_URL,
    logo: `${SITE_URL}/icons/hga.svg`,
    email: HGA_CONTACT.email,
    telephone: HGA_CONTACT.phoneE164,
    address: {
      '@type': 'PostalAddress',
      addressLocality: HGA_CONTACT.city,
      addressRegion: HGA_CONTACT.region,
      addressCountry: 'BR',
    },
    areaServed: { '@type': 'Country', name: 'Brasil' },
    knowsAbout: [
      'Software sob medida',
      'Automação de processos',
      'CRM',
      'Integração de sistemas',
      'Dashboards e BI',
      'Inteligência artificial aplicada',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: HGA_CONTACT.email,
      telephone: HGA_CONTACT.phoneE164,
      availableLanguage: 'Portuguese',
    },
  }
}

export function websiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'HGA Systems',
    inLanguage: 'pt-BR',
    publisher: { '@id': ORG_ID },
  }
}

export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

export function serviceJsonLd(service: { slug: string; title: string; description: string }) {
  return {
    '@type': 'Service',
    '@id': `${SITE_URL}/solucoes/${service.slug}#service`,
    name: service.title,
    description: service.description,
    url: `${SITE_URL}/solucoes/${service.slug}`,
    serviceType: service.title,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Brasil' },
  }
}

export function breadcrumbJsonLd(items: ReadonlyArray<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

/** Serializa um grafo JSON-LD escapando `<` para não fechar a tag script. */
export function jsonLdScript(nodes: object[]) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\u003c')
}
