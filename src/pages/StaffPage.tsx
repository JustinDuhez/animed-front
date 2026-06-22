import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { StaffMember, StaffType } from '../data/staff.js'
import type { Session } from '../data/session.js'
import PageHeader from '../components/ui/PageHeader.js'
import SearchBar from '../components/ui/SearchBar.js'
import FilterBar from '../components/ui/FilterBar.js'
import EmptyState from '../components/ui/EmptyState.js'
import { formatDateTime } from '../utils/format.js'
import { useRole } from '../context/RoleContext.js'

const TYPE_META: Record<StaffType, { label: string; bg: string; color: string; icon: string }> = {
  educateur:        { label: 'Éducateur',   bg: '#e0e7ff', color: '#4338ca', icon: '🧑‍🏫' },
  psychologue:      { label: 'Psychologue', bg: '#fce7f3', color: '#9d174d', icon: '🧠'   },
  infirmier:        { label: 'Infirmier',   bg: '#e0f2fe', color: '#0369a1', icon: '💉'   },
  kinesitherapeute: { label: 'Kiné',        bg: '#dcfce7', color: '#15803d', icon: '🏃'   },
  veterinaire:      { label: 'Vétérinaire', bg: '#fff7ed', color: '#c2410c', icon: '🩺'   },
  benevole:         { label: 'Bénévole',    bg: '#fef9c3', color: '#a16207', icon: '🤝'   },
  autre:            { label: 'Autre',       bg: '#f1f5f9', color: '#475569', icon: '👤'   },
}

const ALL_TYPES: StaffType[] = ['educateur', 'psychologue', 'infirmier', 'kinesitherapeute', 'veterinaire', 'benevole', 'autre']

type FilterTab = 'all' | StaffType

interface Props {
  onAddStaff:    () => void
  onSelectStaff: (id: string, name: string) => void
}

export default function StaffPage({ onAddStaff, onSelectStaff }: Props) {
  const canWrite = useRole() !== 'viewer'
  const [staff,    setStaff]    = useState<StaffMember[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<FilterTab>('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    const unsubStaff = onSnapshot(collection(db, 'staff'), snap => {
      setStaff(
        snap.docs
          .map(d => d.data() as StaffMember)
          .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr')),
      )
      setLoading(false)
    })
    const unsubSessions = onSnapshot(collection(db, 'sessions'), snap => {
      setSessions(snap.docs.map(d => d.data() as Session))
    })
    return () => { unsubStaff(); unsubSessions() }
  }, [])

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<StaffType, number>> = {}
    for (const m of staff) counts[m.type] = (counts[m.type] ?? 0) + 1
    return counts
  }, [staff])

  const filtered = useMemo(() => {
    let data = staff
    if (filter !== 'all') data = data.filter(m => m.type === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(m =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q)  ||
        m.email.toLowerCase().includes(q)     ||
        m.phone.toLowerCase().includes(q),
      )
    }
    return data
  }, [staff, filter, search])

  const stats = useMemo(() => {
    const now = new Date()
    const map: Record<string, { sessionCount: number; nextSession: Session | null }> = {}
    for (const m of staff) {
      const fullName = `${m.firstName} ${m.lastName}`
      const memberSessions = sessions.filter(s => s.handler === fullName)
      const planned = memberSessions
        .filter(s => s.status === 'planned' && new Date(s.date) > now)
        .sort((a, b) => a.date.localeCompare(b.date))
      map[m.id] = {
        sessionCount: memberSessions.length,
        nextSession:  planned[0] ?? null,
      }
    }
    return map
  }, [staff, sessions])

  if (loading) return <EmptyState icon="🥼" title="Chargement…" />

  const activeCount   = staff.filter(m => m.status === 'active').length
  const acacedCount   = staff.filter(m => m.acacedCertified).length

  const filterChips = [
    { key: 'all', label: 'Tous', count: staff.length },
    ...ALL_TYPES
      .filter(t => typeCounts[t])
      .map(t => ({ key: t, label: TYPE_META[t].label, count: typeCounts[t] })),
  ]

  return (
    <>
      <PageHeader
        title="Intervenants"
        subtitle={`${staff.length} intervenant${staff.length !== 1 ? 's' : ''} · ${activeCount} actif${activeCount !== 1 ? 's' : ''} · ${acacedCount} ACACED`}
      >
        {canWrite && <button className="btn btn-primary" onClick={onAddStaff}>+ Ajouter un intervenant</button>}
      </PageHeader>

      <div className="table-wrapper" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="table-toolbar">
          <SearchBar
            placeholder="Nom, e-mail, téléphone…"
            value={search}
            onChange={setSearch}
          />
          <FilterBar chips={filterChips} active={filter} onChange={f => setFilter(f as FilterTab)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🥼"
          title="Aucun intervenant trouvé"
          description={search
            ? `Aucun résultat pour « ${search} ». Essayez un autre terme.`
            : 'Aucun intervenant dans cette catégorie.'}
          action={search
            ? <button className="btn btn-secondary" onClick={() => setSearch('')}>Réinitialiser la recherche</button>
            : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-4)' }}>
          {filtered.map(member => {
            const { label, bg, color, icon } = TYPE_META[member.type]
            const s = stats[member.id] ?? { sessionCount: 0, nextSession: null }
            const fullName = `${member.firstName} ${member.lastName}`
            return (
              <div key={member.id} className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div
                  style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                  onClick={() => onSelectStaff(member.id, fullName)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
                    <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-1)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg, color, letterSpacing: '0.04em' }}>
                          {label}
                        </span>
                        {member.acacedCertified && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d', letterSpacing: '0.04em' }}>
                            ACACED
                          </span>
                        )}
                        {member.status === 'inactive' && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--slate-400)' }}>Inactif</span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.2 }}>
                        {fullName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--slate-100)', display: 'flex', gap: 'var(--sp-4)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1 }}>{s.sessionCount}</div>
                    <div style={{ fontSize: 10, color: 'var(--slate-400)', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      séance{s.sessionCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--slate-100)' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {s.nextSession ? (
                      <>
                        <div style={{ fontSize: 10, color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prochaine</div>
                        <div style={{ fontSize: 11, color: 'var(--green-600)', fontWeight: 600, marginTop: 2 }}>
                          {formatDateTime(s.nextSession.date)}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--slate-400)', fontStyle: 'italic' }}>
                        Aucune séance planifiée
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div style={{ padding: 'var(--sp-3) var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', flex: 1 }}>
                  {member.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontSize: 13 }}>📞</span>
                      <span style={{ fontSize: 12, color: 'var(--slate-600)' }}>{member.phone}</span>
                    </div>
                  )}
                  {member.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontSize: 13 }}>✉</span>
                      <span style={{ fontSize: 12, color: 'var(--slate-500)', wordBreak: 'break-all' }}>{member.email}</span>
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
