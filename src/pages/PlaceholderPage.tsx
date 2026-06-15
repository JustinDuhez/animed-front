import PageHeader from '../components/ui/PageHeader.js'
import EmptyState from '../components/ui/EmptyState.js'

interface Props {
  icon: string
  title: string
  description: string
  cta?: string
}

export default function PlaceholderPage({ icon, title, description, cta }: Props) {
  return (
    <>
      <PageHeader title={title} subtitle={description}>
        {cta && <button className="btn btn-primary">+ {cta}</button>}
      </PageHeader>
      <div className="table-wrapper">
        <EmptyState
          icon={icon}
          title="Page en construction"
          description="Cette section sera disponible prochainement. Le shell de navigation est opérationnel."
          action={<button className="btn btn-secondary">Retour au tableau de bord</button>}
        />
      </div>
    </>
  )
}
