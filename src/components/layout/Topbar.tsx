interface Crumb {
  label: string
  key?: string
}

interface Props {
  crumbs: Crumb[]
  onNavigate: (key: string) => void
}

export default function Topbar({ crumbs, onNavigate }: Props) {
  return (
    <header className="app-topbar">
      <nav className="tb-breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="tb-sep">›</span>}
            {crumb.key ? (
              <button className="tb-crumb" onClick={() => onNavigate(crumb.key!)}>
                {crumb.label}
              </button>
            ) : (
              <span className={`tb-crumb${i === crumbs.length - 1 ? ' current' : ''}`}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

    </header>
  )
}
