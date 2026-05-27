import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal, Session } from '../data/animals.js'

const SESSION_STATUS: Record<Session['status'], { cls: string; label: string }> = {
  completed: { cls: 'badge-actif',  label: 'Effectuée' },
  planned:   { cls: 'badge-repos',  label: 'Planifiée' },
  cancelled: { cls: 'badge-alerte', label: 'Annulée'   },
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  id: string
  onBack: () => void
  onSelectAnimal: (id: string, name: string) => void
}

export default function SessionDetailPage({ id, onBack, onSelectAnimal }: Props) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [animal,  setAnimal]  = useState<Animal  | null | undefined>(undefined)

  useEffect(() => {
    return onSnapshot(doc(db, 'sessions', id), snap => {
      setSession(snap.exists() ? (snap.data() as Session) : null)
    })
  }, [id])

  useEffect(() => {
    if (!session) return
    return onSnapshot(doc(db, 'animals', session.animalId), snap => {
      setAnimal(snap.exists() ? (snap.data() as Animal) : null)
    })
  }, [session?.animalId])

  if (session === undefined) {
    return <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Chargement…</div></div>
  }
  if (!session) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <div className="empty-title">Séance introuvable</div>
        <div className="empty-text">Cette séance n'existe pas ou a été supprimée.</div>
        <button className="btn btn-secondary" onClick={onBack}>Retour aux séances</button>
      </div>
    )
  }

  const d   = new Date(session.date)
  const now = new Date()
  const { cls, label } = SESSION_STATUS[session.status]
  const hasWarning =
    (session.status === 'planned'   && d < now) ||
    (session.status === 'completed' && d > now)

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {animal?.emoji ?? '📋'} {animal?.name ?? session.animalId}
          </h1>
          <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>
            {formatFullDate(session.date)} · {formatTime(session.date)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        </div>
      </div>

      <div className="detail-layout">

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          {/* Session details */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Détails de la séance</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--sp-1)' }}>
                <span className={`badge ${cls}`}><span className="badge-dot" />{label}</span>
                {hasWarning && (
                  <span style={{ fontSize: 10, color: 'var(--amber-600)', fontWeight: 600 }}>
                    {session.status === 'planned' ? '⚠ Date dépassée' : '⚠ Date future'}
                  </span>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">

                <div className="info-tile">
                  <div className="info-label">Date</div>
                  <div className="info-value" style={{ textTransform: 'capitalize' }}>
                    {formatFullDate(session.date)}
                  </div>
                </div>

                <div className="info-tile">
                  <div className="info-label">Heure</div>
                  <div className="info-value">{formatTime(session.date)}</div>
                </div>

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Structure</div>
                  <div className="info-value">{session.structure || '—'}</div>
                </div>

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Intervenant</div>
                  <div className="info-value">{session.handler || '—'}</div>
                </div>

              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header"><div className="card-title">Notes</div></div>
            <div className="card-body">
              {session.notes ? (
                <p style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6, margin: 0 }}>
                  {session.notes}
                </p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>
                  Aucune note renseignée.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          {/* Animal */}
          <div className="card">
            <div className="card-header"><div className="card-title">Animal</div></div>
            <div className="card-body">
              {animal === undefined ? (
                <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>Chargement…</div>
              ) : !animal ? (
                <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>Animal introuvable</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                    <div style={{ fontSize: 36, lineHeight: 1 }}>{animal.emoji}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--slate-900)' }}>{animal.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>{animal.species}</div>
                      <div style={{ fontSize: 11, color: 'var(--slate-400)', fontFamily: 'monospace', marginTop: 2 }}>{animal.id}</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => onSelectAnimal(animal.id, animal.name)}
                  >
                    Voir la fiche animal
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Session ID */}
          <div className="card">
            <div className="card-header"><div className="card-title">Référence</div></div>
            <div className="card-body">
              <div className="info-tile" style={{ margin: 0 }}>
                <div className="info-label">Identifiant</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--slate-500)', marginTop: 4, wordBreak: 'break-all' }}>
                  {session.id}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
