import type { Session } from '../../data/session.js'
import type { Animal } from '../../data/animal.js'
import { SESSION_STATUS_MAP } from '../../utils/badges.js'
import { formatDateTime } from '../../utils/format.js'

interface Props {
  session: Session
  animals?: Animal[]
  onClick?: () => void
}

export default function SessionCard({ session, animals, onClick }: Props) {
  const { cls, label } = SESSION_STATUS_MAP[session.status]
  return (
    <div
      className="session-card"
      style={onClick ? { cursor: 'pointer' } : undefined}
      onClick={onClick}
    >
      <div className="sc-header">
        <div>
          <div className="sc-title">{session.structure || '—'}</div>
          <div className="sc-date">{formatDateTime(session.date)}</div>
        </div>
        <span className={`badge ${cls}`}><span className="badge-dot" />{label}</span>
      </div>
      {animals && animals.length > 0 && (
        <div className="sc-animal">{animals.map(a => `${a.emoji} ${a.name}`).join(', ')}</div>
      )}
      <div className="sc-meta">
        <span>🥼 {session.handler || '—'}</span>
      </div>
    </div>
  )
}
