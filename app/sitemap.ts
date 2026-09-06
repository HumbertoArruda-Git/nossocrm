import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/site'
import { solutions } from '@/lib/content/solutions'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...solutions.map((solution) => ({
      url: `${SITE_URL}/solucoes/${solution.slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/privacidade`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]
}
