interface Props {
  icon: string
  title: string
  description: string
  cta?: string
}

export default function PlaceholderPage({ icon, title, description, cta }: Props) {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
        {cta && <button className="btn btn-primary">+ {cta}</button>}
      </div>
      <div className="table-wrapper">
        <div className="empty-state">
          <div className="empty-icon">{icon}</div>
          <div className="empty-title">Page en construction</div>
          <div className="empty-text">
            Cette section sera disponible prochainement. Le shell de navigation est opérationnel.
          </div>
          <button className="btn btn-secondary">Retour au tableau de bord</button>
        </div>
      </div>
    </>
  )
}
