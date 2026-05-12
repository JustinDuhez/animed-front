const KPI_CARDS = [
  {
    icon: '🐾', iconColor: 'green',
    value: '47', label: 'Animaux actifs',
    sub: '+3 depuis le mois dernier',
    trend: 'up', trendLabel: '↑ +3',
    sparks: [40, 55, 48, 70, 60, 85, 100],
    sparkColor: undefined,
  },
  {
    icon: '📋', iconColor: 'terra',
    value: '284', label: 'Séances ce trimestre',
    sub: '568h cumulées · 31 structures',
    trend: 'up', trendLabel: '↑ +12%',
    sparks: [50, 65, 72, 58, 80, 68, 100],
    sparkColor: 'var(--terra-300)',
  },
  {
    icon: '⚠️', iconColor: 'amber',
    value: '5', label: 'Alertes sanitaires',
    sub: '3 vaccins · 2 visites vétérinaires',
    trend: 'down', trendLabel: '↑ +2',
    sparks: null,
  },
  {
    icon: '🏥', iconColor: 'blue',
    value: '31', label: 'Structures partenaires',
    sub: 'EHPAD, IME, Hôpitaux, Crèches',
    trend: 'flat', trendLabel: '→ =',
    sparks: null,
  },
  {
    icon: '🥼', iconColor: 'green',
    value: '18', label: 'Intervenants actifs',
    sub: 'Tous certifiés ACACED',
    trend: 'up', trendLabel: '↑ +5',
    sparks: null,
  },
  {
    icon: '⏱', iconColor: 'terra',
    value: '2,4h', label: 'Durée moyenne / séance',
    sub: 'Min 1h · Max 4h',
    trend: 'up', trendLabel: '↑ +0.4h',
    sparks: null,
  },
]

const ANIMALS = [
  { emoji: '🐕', name: 'Martin',   id: 'MAR-00043', species: 'Labrador',      status: 'actif',    vaccine: 'alerte',   sessions: 6,  lastSession: '10 avr. 2025',  handler: 'S. Durand' },
  { emoji: '🐈', name: 'Luna',     id: 'LUN-00021', species: 'Persan',        status: 'actif',    vaccine: 'actif',    sessions: 4,  lastSession: '8 avr. 2025',   handler: 'M. Petit' },
  { emoji: '🐇', name: 'Cannelle', id: 'CAN-00012', species: 'Lapin angora',  status: 'repos',    vaccine: 'actif',    sessions: 2,  lastSession: '1 avr. 2025',   handler: 'L. Martin' },
  { emoji: '🐴', name: 'Tao',      id: 'TAO-00007', species: 'Poney Shetland',status: 'alerte',   vaccine: 'alerte',   sessions: 1,  lastSession: '22 mars 2025',  handler: 'A. Rossi' },
  { emoji: '🦜', name: 'Pixel',    id: 'PIX-00033', species: 'Perruche',      status: 'retraite', vaccine: 'actif',    sessions: 0,  lastSession: '—',              handler: '—' },
]

const SESSIONS = [
  { structure: 'EHPAD Les Jardins', date: 'Lun 28 avr · 14h–16h', animal: '🐕 Martin', handler: 'S. Durand', status: 'info', statusLabel: 'Planifiée' },
  { structure: 'IME Saint-Joseph',  date: 'Mer 03 mai · 10h',      animal: '🐕 Martin', handler: 'A. Rossi',  status: 'alerte', statusLabel: 'Alerte' },
  { structure: 'Clinique Pasteur',  date: 'Ven 30 mai · 09h',      animal: '🐈 Luna',   handler: 'M. Petit',  status: 'repos', statusLabel: 'En attente' },
]

const statusBadge = (s: string) => {
  const map: Record<string, string> = { actif: 'badge-actif', repos: 'badge-repos', alerte: 'badge-alerte', retraite: 'badge-retraite', info: 'badge-info', neutral: 'badge-neutral' }
  const label: Record<string, string> = { actif: 'Actif', repos: 'Repos', alerte: 'Alerte', retraite: 'Retraité', info: 'Planifiée' }
  return <span className={`badge ${map[s] ?? 'badge-neutral'}`}><span className="badge-dot" />{label[s] ?? s}</span>
}

interface Props {
  onSelectAnimal: (id: string, name: string) => void
}

export default function Dashboard({ onSelectAnimal }: Props) {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Lundi 28 avril 2025 · Bienvenue, S. Durand</p>
        </div>
        <button className="btn btn-primary">+ Planifier une séance</button>
      </div>

      {/* Alert banner */}
      <div className="alert alert-warning" style={{ marginBottom: 'var(--sp-5)' }}>
        <span className="alert-icon">⚠</span>
        <div className="alert-body">
          <div className="alert-title">5 alertes sanitaires nécessitent votre attention</div>
          <div className="alert-text">Martin et Tao ont des vaccinations expirées. 2 visites vétérinaires sont à planifier avant les prochaines séances.</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>Voir les alertes</button>
      </div>

      {/* KPI grid */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        {KPI_CARDS.map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-header">
              <div className={`kpi-icon ${k.iconColor}`}>{k.icon}</div>
              <span className={`kpi-trend ${k.trend}`}>{k.trendLabel}</span>
            </div>
            <div className="kpi-value" style={k.value.includes(',') ? { fontSize: 24 } : undefined}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-sub">{k.sub}</div>
            {k.sparks && (
              <div className="kpi-spark">
                {k.sparks.map((h, i) => (
                  <div
                    key={i}
                    className={`spark-bar${i === k.sparks!.length - 1 ? ' active' : ''}`}
                    style={{ height: `${h}%`, ...(k.sparkColor ? { background: k.sparkColor } : {}) }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main content: table + sessions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--sp-5)', alignItems: 'start' }}>

        {/* Animals table */}
        <div className="table-wrapper">
          <div className="table-toolbar">
            <div className="card-title" style={{ marginRight: 'auto' }}>Animaux récents</div>
            <div className="search-bar" style={{ maxWidth: 220 }}>
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Rechercher…" />
            </div>
            <div className="filter-bar">
              <div className="filter-chip active">Tous</div>
              <div className="filter-chip">⚠ Alertes</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" className="table-check" /></th>
                <th className="sortable">Animal</th>
                <th>Statut</th>
                <th>Vaccin</th>
                <th className="sortable">Séances / mois</th>
                <th>Dernière séance</th>
                <th>Intervenant</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ANIMALS.map((a) => (
                <tr key={a.id}>
                  <td><input type="checkbox" className="table-check" /></td>
                  <td className="td-primary">
                    <div
                      className="td-cell-animal"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectAnimal(a.id, a.name)}
                    >
                      <div className="td-av">{a.emoji}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--slate-400)' }}>{a.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{statusBadge(a.status)}</td>
                  <td>{statusBadge(a.vaccine)}</td>
                  <td>{a.sessions}</td>
                  <td style={{ color: 'var(--slate-500)' }}>{a.lastSession}</td>
                  <td style={{ color: 'var(--slate-600)' }}>{a.handler}</td>
                  <td className="td-actions">
                    <button className="td-action-btn">✏</button>
                    <button className="td-action-btn">🔗</button>
                    <button className="td-action-btn danger">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-pagination">
            <span className="pag-info">Affichage 1–5 sur 47 animaux</span>
            <div className="pag-controls">
              <button className="pag-btn" disabled>«</button>
              <button className="pag-btn" disabled>‹</button>
              <button className="pag-btn active">1</button>
              <button className="pag-btn">2</button>
              <button className="pag-btn">3</button>
              <button className="pag-btn">›</button>
              <button className="pag-btn">»</button>
            </div>
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Séances à venir</div>
              <div className="card-subtitle">3 planifiées</div>
            </div>
            <button className="btn btn-ghost btn-sm">Voir tout</button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {SESSIONS.map((s, i) => (
              <div
                key={i}
                className={`session-card${s.status === 'alerte' ? ' session-alerte' : s.status === 'repos' ? ' session-pending' : ''}`}
              >
                <div className="sc-header">
                  <div>
                    <div className="sc-title">{s.structure}</div>
                    <div className="sc-date">{s.date}</div>
                  </div>
                  <span className={`badge badge-${s.status}`}>
                    <span className="badge-dot" />{s.statusLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                  <div className="sc-animal">{s.animal}</div>
                </div>
                <div className="sc-meta">
                  <span>🥼 {s.handler}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              + Planifier une séance
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
