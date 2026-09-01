import Link from 'next/link'

interface ServiceRowProps {
  slug: string
  category: string
  title: string
  description: string
}

export function ServiceRow({ slug, category, title, description }: ServiceRowProps) {
  return (
    <Link href={`/solucoes/${slug}`} className="hga-service-row">
      <span className="hga-service-category">{category}</span>
      <div className="hga-service-body">
        <h3 className="hga-service-title">{title}</h3>
        <p className="hga-service-desc">{description}</p>
      </div>
    </Link>
  )
}
