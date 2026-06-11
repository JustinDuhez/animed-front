import type { Session } from '../../data/session.js'
import type { Animal } from '../../data/animal.js'

const SESSION_STATUS: Record<Session['status'], { cls: string; label: string }> = {
  completed: { cls: 'badge-actif',  label: 'Effectuée' },
  planned:   { cls: 'badge-repos',  label: 'Planifiée' },
  cancelled: { cls: 'badge-alerte', label: 'Annulée'   },
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso)
  const day  = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

interface Props {
  session: Session
  animal?: Animal
  onClick?: () => void
}

export default function SessionCard({ session, animal, onClick }: Props) {
  const { cls, label } = SESSION_STATUS[session.status]
  return (
    <div
      className="session-card"
      style={onClick ? { cursor: 'pointer' } : undefined}
      onClick={onClick}
    >
      <div className="sc-header">
        <div>
          <div className="sc-title">{session.structure || '—'}</div>
          <div className="sc-date">{formatSessionDate(session.date)}</div>
        </div>
        <span className={`badge ${cls}`}><span className="badge-dot" />{label}</span>
      </div>
      {animal && <div className="sc-animal">{animal.emoji} {animal.name}</div>}
      <div className="sc-meta">
        <span>🥼 {session.handler || '—'}</span>
      </div>
    </div>
  )
}
