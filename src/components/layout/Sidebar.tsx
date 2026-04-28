interface NavItem {
  icon: string
  label: string
  key: string
  badge?: number
  count?: number
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV: NavSection[] = [
  {
    label: 'Gestion',
    items: [
      { icon: '🏠', label: 'Tableau de bord', key: 'dashboard' },
      { icon: '🐾', label: 'Animaux',          key: 'animals',    count: 47 },
      { icon: '📋', label: 'Séances',          key: 'sessions' },
      { icon: '🏥', label: 'Structures',       key: 'structures' },
    ],
  },
  {
    label: 'Compte',
    items: [
      { icon: '🥼', label: 'Intervenants', key: 'staff' },
      { icon: '⚠️',  label: 'Alertes',     key: 'alerts', badge: 5 },
    ],
  },
  {
    label: 'Paramètres',
    items: [
      { icon: '⚙️', label: 'Paramètres', key: 'settings' },
    ],
  },
]

interface Props {
  activePage: string
  onNavigate: (key: string) => void
}

export default function Sidebar({ activePage, onNavigate }: Props) {
  return (
    <aside className="app-sidebar">
      <div className="sb-brand">
        <div className="sb-logo">🐾</div>
        <div>
          <div className="sb-title">AniMed</div>
          <div className="sb-sub">Back Office</div>
        </div>
      </div>

      <nav className="sb-nav">
        {NAV.map((section) => (
          <div key={section.label} className="sb-section">
            <div className="sb-section-label">{section.label}</div>
            {section.items.map((item) => (
              <button
                key={item.key}
                className={`sb-link${activePage === item.key ? ' active' : ''}`}
                onClick={() => onNavigate(item.key)}
              >
                <span className="sb-icon">{item.icon}</span>
                {item.label}
                {item.badge !== undefined && (
                  <span className="sb-badge">{item.badge}</span>
                )}
                {item.count !== undefined && (
                  <span className="sb-count">{item.count}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">SD</div>
          <div>
            <div className="sb-user-name">S. Durand</div>
            <div className="sb-user-role">Administrateur</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
