import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal } from '../data/animal.js'
import type { Session } from '../data/session.js'
import PageHeader from '../components/ui/PageHeader.js'
import SearchBar from '../components/ui/SearchBar.js'
import FilterBar from '../components/ui/FilterBar.js'
import EmptyState from '../components/ui/EmptyState.js'
import SessionGridCard from '../components/ui/SessionGridCard.js'
import { formatMonthHeading, formatSessionLabel } from '../utils/format.js'
import { useRole } from '../context/RoleContext.js'

type FilterTab = 'all' | 'completed' | 'planned' | 'cancelled'

const FILTER_LABELS: Record<FilterTab, string> = {
  all:       'Toutes',
  completed: 'Effectuées',
  planned:   'Planifiées',
  cancelled: 'Annulées',
}

interface Props {
  onSelectAnimal: (id: string, name: string) => void
  onAddSession: () => void
  onSelectSession: (id: string, label: string) => void
}

export default function SessionsPage({ onSelectAnimal, onAddSession, onSelectSession }: Props) {
  const canWrite = useRole() !== 'viewer'
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
        s.animalIds.some(id => (animals[id]?.name ?? '').toLowerCase().includes(q)) ||
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

  if (loading) return <EmptyState icon="📋" title="Chargement…" />

  const filterChips = (['all', 'completed', 'planned', 'cancelled'] as FilterTab[]).map(f => ({
    key: f, label: FILTER_LABELS[f], count: counts[f],
  }))

  return (
    <>
      <PageHeader
        title="Séances"
        subtitle={`${counts.all} séance${counts.all !== 1 ? 's' : ''} · ${counts.planned} planifiée${counts.planned !== 1 ? 's' : ''}`}
      >
        {canWrite && <button className="btn btn-primary" onClick={onAddSession}>+ Planifier une séance</button>}
      </PageHeader>

      <div className="table-wrapper" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="table-toolbar">
          <SearchBar
            placeholder="Animal, structure, intervenant…"
            value={search}
            onChange={setSearch}
          />
          <FilterBar chips={filterChips} active={filter} onChange={f => setFilter(f as FilterTab)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Aucune séance trouvée"
          description={search
            ? `Aucun résultat pour « ${search} ». Essayez un autre terme.`
            : 'Aucune séance dans cette catégorie.'}
          action={search
            ? <button className="btn btn-secondary" onClick={() => setSearch('')}>Réinitialiser la recherche</button>
            : undefined}
        />
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
                {monthSessions.map(s => (
                  <SessionGridCard
                    key={s.id}
                    session={s}
                    animals={s.animalIds.map(id => animals[id]).filter((a): a is Animal => !!a)}
                    onSelect={() => onSelectSession(s.id, formatSessionLabel(s.date))}
                    onSelectAnimal={onSelectAnimal}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
