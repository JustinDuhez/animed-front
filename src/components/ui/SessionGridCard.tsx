import type { Session } from '../../data/session.js'
import type { Animal } from '../../data/animal.js'
import { SESSION_STATUS_MAP } from '../../utils/badges.js'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  session: Session
  animal?: Animal
  onSelect: () => void
  onSelectAnimal?: (id: string, name: string) => void
}

export default function SessionGridCard({ session, animal, onSelect, onSelectAnimal }: Props) {
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

      {/* Animal row — only when navigation is available */}
      {onSelectAnimal !== undefined && (
        <div
          style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: animal ? 'pointer' : 'default' }}
          onClick={() => animal && onSelectAnimal(animal.id, animal.name)}
        >
          <div style={{ fontSize: 26, lineHeight: 1 }}>{animal?.emoji ?? '🐾'}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: animal ? 'var(--green-600)' : 'var(--slate-900)' }}>
              {animal?.name ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--slate-400)', fontFamily: 'monospace' }}>
              {session.animalId}
            </div>
          </div>
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
