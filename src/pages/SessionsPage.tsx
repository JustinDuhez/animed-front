import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal } from '../data/animal.js'
import type { Session } from '../data/session.js'

type FilterTab = 'all' | 'completed' | 'planned' | 'cancelled'

const SESSION_STATUS: Record<Session['status'], { cls: string; label: string }> = {
  completed: { cls: 'badge-actif',  label: 'Effectuée' },
  planned:   { cls: 'badge-repos',  label: 'Planifiée' },
  cancelled: { cls: 'badge-alerte', label: 'Annulée'   },
}

const FILTER_LABELS: Record<FilterTab, string> = {
  all:       'Toutes',
  completed: 'Effectuées',
  planned:   'Planifiées',
  cancelled: 'Annulées',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatMonthHeading(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

interface Props {
  onSelectAnimal: (id: string, name: string) => void
  onAddSession: () => void
  onSelectSession: (id: string, label: string) => void
}

export default function SessionsPage({ onSelectAnimal, onAddSession, onSelectSession }: Props) {
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [animals,   setAnimals]   = useState<Record<string, Animal>>({})
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<FilterTab>('all')
  const [search,    setSearch]    = useState('')

  useEffect(() => {
    const unsubSessions = onSnapshot(collection(db, 'sessions'), snap => {
      setSessions(
        snap.docs
          .map(d => d.data() as Session)
          .sort((a, b) => b.date.localeCompare(a.date))
      )
      setLoading(false)
    })
    const unsubAnimals = onSnapshot(collection(db, 'animals'), snap => {
      const map: Record<string, Animal> = {}
      snap.docs.forEach(d => { const a = d.data() as Animal; map[a.id] = a })
      setAnimals(map)
    })
    return () => { unsubSessions(); unsubAnimals() }
  }, [])

  const counts = useMemo(() => ({
    all:       sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    planned:   sessions.filter(s => s.status === 'planned').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
  }), [sessions])

  const filtered = useMemo(() => {
    let data = sessions
    if (filter !== 'all') data = data.filter(s => s.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(s =>
        (animals[s.animalId]?.name ?? '').toLowerCase().includes(q) ||
        s.structure.toLowerCase().includes(q) ||
        s.handler.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q)
      )
    }
    return data
  }, [sessions, animals, filter, search])

  const grouped = useMemo(() => {
    const map: Record<string, Session[]> = {}
    for (const s of filtered) {
      const key = s.date.slice(0, 7)
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  if (loading) return (
    <div className="empty-state">
      <div className="empty-icon">📋</div>
      <div className="empty-title">Chargement…</div>
    </div>
  )

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Séances</h1>
          <p className="page-subtitle">
            {counts.all} séance{counts.all !== 1 ? 's' : ''} · {counts.planned} planifiée{counts.planned !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAddSession}>+ Planifier une séance</button>
      </div>

      <div className="table-wrapper" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="table-toolbar">
          <div className="search-bar" style={{ maxWidth: 280 }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Animal, structure, intervenant…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-bar" style={{ flex: 1 }}>
            {(['all', 'completed', 'planned', 'cancelled'] as FilterTab[]).map(f => (
              <div
                key={f}
                className={`filter-chip${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {FILTER_LABELS[f]}
                <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.65, marginLeft: 3 }}>
                  {counts[f]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">Aucune séance trouvée</div>
          <div className="empty-text">
            {search
              ? `Aucun résultat pour « ${search} ». Essayez un autre terme.`
              : 'Aucune séance dans cette catégorie.'}
          </div>
          {search && (
            <button className="btn btn-secondary" onClick={() => setSearch('')}>Réinitialiser la recherche</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {grouped.map(([month, monthSessions]) => (
            <div key={month}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--slate-400)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 'var(--sp-3)',
              }}>
                {formatMonthHeading(month)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--sp-3)' }}>
                {monthSessions.map(s => {
                  const animal = animals[s.animalId]
                  const { cls, label } = SESSION_STATUS[s.status]
                  const d = new Date(s.date)
                  const now = new Date()
                  return (
                    <div key={s.id} className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>

                      {/* Header — date + status (click → detail) */}
                      <div
                        style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                        onClick={() => onSelectSession(s.id, `${d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'long' })} · ${formatTime(s.date)}`)}
                      >
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'capitalize' }}>
                            {d.toLocaleDateString('fr-FR', { weekday: 'long' })}
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1.1 }}>
                            {d.getDate()} <span style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize' }}>{d.toLocaleDateString('fr-FR', { month: 'long' })}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 2 }}>
                            {formatTime(s.date)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--sp-1)' }}>
                          <span className={`badge ${cls}`}><span className="badge-dot" />{label}</span>
                          {s.status === 'planned' && d < now && (
                            <span style={{ fontSize: 10, color: 'var(--amber-600)', fontWeight: 600 }}>⚠ Date dépassée</span>
                          )}
                          {s.status === 'completed' && d > now && (
                            <span style={{ fontSize: 10, color: 'var(--amber-600)', fontWeight: 600 }}>⚠ Date future</span>
                          )}
                        </div>
                      </div>

                      {/* Animal */}
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
                            {s.animalId}
                          </div>
                        </div>
                      </div>

                      {/* Structure + handler + notes */}
                      <div style={{ padding: 'var(--sp-3) var(--sp-4)', flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-700)' }}>
                          {s.structure || '—'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
                          {s.handler || '—'}
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
