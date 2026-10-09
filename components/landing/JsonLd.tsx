import { jsonLdScript } from '@/lib/seo/jsonld'

export function JsonLd({ nodes }: { nodes: object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(nodes) }} />
}
