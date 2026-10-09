import type { MetadataRoute } from 'next'
import { CONTENT_UPDATED_AT, SITE_URL } from '@/lib/seo/site'
import { solutions } from '@/lib/content/solutions'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: CONTENT_UPDATED_AT.home,
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...solutions.map((solution) => ({
      url: `${SITE_URL}/solucoes/${solution.slug}`,
      lastModified: CONTENT_UPDATED_AT.solucoes,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/privacidade`,
      lastModified: CONTENT_UPDATED_AT.privacidade,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]
}
