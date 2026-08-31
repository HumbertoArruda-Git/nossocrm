interface ServiceRowProps {
  category: string
  title: string
  description: string
}

export function ServiceRow({ category, title, description }: ServiceRowProps) {
  return (
    <div className="hga-service-row">
      <span className="hga-service-category">{category}</span>
      <div className="hga-service-body">
        <h3 className="hga-service-title">{title}</h3>
        <p className="hga-service-desc">{description}</p>
      </div>
    </div>
  )
}
