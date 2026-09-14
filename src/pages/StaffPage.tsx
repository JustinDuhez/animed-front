import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { UserRecord, UserType } from '../data/user.js'
import { USER_TYPES, USER_TYPE_META } from '../data/user.js'
import type { Session } from '../data/session.js'
import PageHeader from '../components/ui/PageHeader.js'
import SearchBar from '../components/ui/SearchBar.js'
import FilterBar from '../components/ui/FilterBar.js'
import EmptyState from '../components/ui/EmptyState.js'
import { formatDateTime } from '../utils/format.js'
import { useRole, useDisplayName } from '../context/RoleContext.js'
import { sessionsQuery } from '../utils/sessionsQuery.js'

type FilterTab = 'all' | UserType

interface Props {
  onSelectStaff: (uid: string, name: string) => void
}

export default function StaffPage({ onSelectStaff }: Props) {
  const role         = useRole()
  const displayName  = useDisplayName()
  const [users,    setUsers]    = useState<UserRecord[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<FilterTab>('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      setUsers(
        snap.docs
          .map(d => ({ uid: d.id, ...d.data() } as UserRecord))
          .filter(u => !u.email.toLowerCase().includes('test') && !u.displayName.toLowerCase().includes('test'))
          .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr')),
      )
      setLoading(false)
    })
    const unsubSessions = onSnapshot(sessionsQuery(role, displayName), snap => {
      setSessions(snap.docs.map(d => d.data() as Session))
    })
    return () => { unsubUsers(); unsubSessions() }
  }, [role, displayName])

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<UserType, number>> = {}
    for (const u of users) {
      if (u.type) counts[u.type] = (counts[u.type] ?? 0) + 1
    }
    return counts
  }, [users])

  const filtered = useMemo(() => {
    let data = users
    if (filter !== 'all') data = data.filter(u => u.type === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(u =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)       ||
        (u.phone ?? '').toLowerCase().includes(q),
      )
    }
    return data
  }, [users, filter, search])

  const stats = useMemo(() => {
    const now = new Date()
    const map: Record<string, { sessionCount: number; nextSession: Session | null }> = {}
    for (const u of users) {
      const userSessions = sessions.filter(s => s.handler === u.displayName)
      const planned = userSessions
        .filter(s => s.status === 'planned' && new Date(s.date) > now)
        .sort((a, b) => a.date.localeCompare(b.date))
      map[u.uid] = {
        sessionCount: userSessions.length,
        nextSession:  planned[0] ?? null,
      }
    }
    return map
  }, [users, sessions])

  if (loading) return <EmptyState icon="🥼" title="Chargement…" />

  const acacedCount = users.filter(u => u.acacedCertified).length

  const filterChips = [
    { key: 'all', label: 'Tous', count: users.length },
    ...USER_TYPES
      .filter(t => typeCounts[t])
      .map(t => ({ key: t, label: USER_TYPE_META[t].label, count: typeCounts[t] })),
  ]

  return (
    <>
      <PageHeader
        title="Intervenants"
        subtitle={`${users.length} intervenant${users.length !== 1 ? 's' : ''} · ${acacedCount} ACACED`}
      />

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
          {filtered.map(user => {
            const typeMeta = user.type ? USER_TYPE_META[user.type] : null
            const s = stats[user.uid] ?? { sessionCount: 0, nextSession: null }
            return (
              <div key={user.uid} className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div
                  style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                  onClick={() => onSelectStaff(user.uid, user.displayName)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
                    <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{typeMeta?.icon ?? '👤'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-1)' }}>
                        {typeMeta && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: typeMeta.bg, color: typeMeta.color, letterSpacing: '0.04em' }}>
                            {typeMeta.label}
                          </span>
                        )}
                        {user.acacedCertified && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d', letterSpacing: '0.04em' }}>
                            ACACED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.2 }}>
                        {user.displayName || user.email}
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
                  {user.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontSize: 13 }}>📞</span>
                      <span style={{ fontSize: 12, color: 'var(--slate-600)' }}>{user.phone}</span>
                    </div>
                  )}
                  {user.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontSize: 13 }}>✉</span>
                      <span style={{ fontSize: 12, color: 'var(--slate-500)', wordBreak: 'break-all' }}>{user.email}</span>
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
