import type { Session } from '../../data/session.js'
import type { Animal } from '../../data/animal.js'
import { SESSION_STATUS_MAP } from '../../utils/badges.js'
import { formatTime } from '../../utils/format.js'

interface Props {
  session: Session
  animals?: Animal[]
  onSelect: () => void
  onSelectAnimal?: (id: string, name: string) => void
}

export default function SessionGridCard({ session, animals, onSelect, onSelectAnimal }: Props) {
  const { cls, label } = SESSION_STATUS_MAP[session.status]
  const d   = new Date(session.date)
  const now = new Date()

  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>

      {/* Header — date + status */}
      <div
        style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
        onClick={onSelect}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'capitalize' }}>
            {d.toLocaleDateString('fr-FR', { weekday: 'long' })}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1.1 }}>
            {d.getDate()}{' '}
            <span style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize' }}>
              {d.toLocaleDateString('fr-FR', { month: 'long' })}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 2 }}>
            {formatTime(session.date)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--sp-1)' }}>
          <span className={`badge ${cls}`}><span className="badge-dot" />{label}</span>
          {session.status === 'planned'   && d < now && <span style={{ fontSize: 10, color: 'var(--amber-600)', fontWeight: 600 }}>⚠ Date dépassée</span>}
          {session.status === 'completed' && d > now && <span style={{ fontSize: 10, color: 'var(--amber-600)', fontWeight: 600 }}>⚠ Date future</span>}
        </div>
      </div>

      {/* Animals row — only when navigation is available */}
      {onSelectAnimal !== undefined && (
        <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--slate-100)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {animals && animals.length > 0 ? animals.map(a => (
            <div
              key={a.id}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: 'pointer' }}
              onClick={() => onSelectAnimal(a.id, a.name)}
            >
              <div style={{ fontSize: 22, lineHeight: 1 }}>{a.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-600)' }}>{a.name}</div>
            </div>
          )) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <div style={{ fontSize: 22, lineHeight: 1 }}>🐾</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)' }}>—</div>
            </div>
          )}
        </div>
      )}

      {/* Structure + handler */}
      <div style={{ padding: 'var(--sp-3) var(--sp-4)', flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-700)' }}>
          {session.structure || '—'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
          {session.handler || '—'}
        </div>
      </div>

    </div>
  )
}
