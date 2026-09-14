import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import { ORG_TYPES, ORG_TYPE_META } from '../data/organization.js'
import type { Organization, OrgType } from '../data/organization.js'
import type { Session } from '../data/session.js'
import PageHeader from '../components/ui/PageHeader.js'
import SearchBar from '../components/ui/SearchBar.js'
import FilterBar from '../components/ui/FilterBar.js'
import EmptyState from '../components/ui/EmptyState.js'
import { formatDateTime } from '../utils/format.js'
import { useRole, useDisplayName } from '../context/RoleContext.js'
import { sessionsQuery } from '../utils/sessionsQuery.js'


type FilterTab = 'all' | OrgType


interface Props {
  onAddOrganization: () => void
  onSelectOrganization: (id: string, name: string) => void
}

export default function OrganizationsPage({ onAddOrganization, onSelectOrganization }: Props) {
  const role         = useRole()
  const displayName  = useDisplayName()
  const canWrite = role !== 'viewer'
  const [orgs,     setOrgs]     = useState<Organization[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<FilterTab>('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    const unsubOrgs = onSnapshot(collection(db, 'organizations'), snap => {
      setOrgs(
        snap.docs
          .map(d => d.data() as Organization)
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      )
      setLoading(false)
    })
    const unsubSessions = onSnapshot(sessionsQuery(role, displayName), snap => {
      setSessions(snap.docs.map(d => d.data() as Session))
    })
    return () => { unsubOrgs(); unsubSessions() }
  }, [role, displayName])

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<OrgType, number>> = {}
    for (const o of orgs) counts[o.type] = (counts[o.type] ?? 0) + 1
    return counts
  }, [orgs])

  const filtered = useMemo(() => {
    let data = orgs
    if (filter !== 'all') data = data.filter(o => o.type === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.contact.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q)
      )
    }
    return data
  }, [orgs, filter, search])

  const stats = useMemo(() => {
    const now = new Date()
    const map: Record<string, { sessionCount: number; nextSession: Session | null }> = {}
    for (const org of orgs) {
      const orgSessions = sessions.filter(s => s.structure === org.name)
      const planned = orgSessions
        .filter(s => s.status === 'planned' && new Date(s.date) > now)
        .sort((a, b) => a.date.localeCompare(b.date))
      map[org.id] = {
        sessionCount: orgSessions.length,
        nextSession:  planned[0] ?? null,
      }
    }
    return map
  }, [orgs, sessions])

  if (loading) return <EmptyState icon="🏥" title="Chargement…" />

  const activeCount   = orgs.filter(o => o.status === 'active').length
  const inactiveCount = orgs.filter(o => o.status === 'inactive').length

  const filterChips = [
    { key: 'all', label: 'Toutes', count: orgs.length },
    ...ORG_TYPES
      .filter((t: OrgType) => typeCounts[t])
      .map((t: OrgType) => ({ key: t, label: ORG_TYPE_META[t].label, count: typeCounts[t] })),
  ]

  return (
    <>
      <PageHeader
        title="Structures"
        subtitle={`${orgs.length} structure${orgs.length !== 1 ? 's' : ''} · ${activeCount} active${activeCount !== 1 ? 's' : ''}${inactiveCount > 0 ? ` · ${inactiveCount} inactive${inactiveCount !== 1 ? 's' : ''}` : ''}`}
      >
        {canWrite && <button className="btn btn-primary" onClick={onAddOrganization}>+ Ajouter une structure</button>}
      </PageHeader>

      <div className="table-wrapper" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="table-toolbar">
          <SearchBar
            placeholder="Nom, adresse, contact…"
            value={search}
            onChange={setSearch}
          />
          <FilterBar chips={filterChips} active={filter} onChange={f => setFilter(f as FilterTab)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🏥"
          title="Aucune structure trouvée"
          description={search
            ? `Aucun résultat pour « ${search} ». Essayez un autre terme.`
            : 'Aucune structure dans cette catégorie.'}
          action={search
            ? <button className="btn btn-secondary" onClick={() => setSearch('')}>Réinitialiser la recherche</button>
            : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-4)' }}>
          {filtered.map(org => {
            const { label, bg, color, icon } = ORG_TYPE_META[org.type]
            const s = stats[org.id] ?? { sessionCount: 0, nextSession: null }
            return (
              <div key={org.id} className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div
                  style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                  onClick={() => onSelectOrganization(org.id, org.name)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
                    <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-1)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg, color, letterSpacing: '0.04em' }}>
                          {label}
                        </span>
                        {org.status === 'inactive' && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--slate-400)' }}>Inactive</span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.2 }}>
                        {org.name}
                      </div>
                    </div>
                  </div>
                  {org.address && (
                    <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {org.address}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--slate-100)', display: 'flex', gap: 'var(--sp-4)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1 }}>{s.sessionCount}</div>
                    <div style={{ fontSize: 10, color: 'var(--slate-400)', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      séance{s.sessionCount > 1 ? 's' : ''}
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
                  {org.contact && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontSize: 13 }}>👤</span>
                      <span style={{ fontSize: 12, color: 'var(--slate-700)', fontWeight: 600 }}>{org.contact}</span>
                    </div>
                  )}
                  {org.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontSize: 13 }}>📞</span>
                      <span style={{ fontSize: 12, color: 'var(--slate-600)' }}>{org.phone}</span>
                    </div>
                  )}
                  {org.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontSize: 13 }}>✉</span>
                      <span style={{ fontSize: 12, color: 'var(--slate-500)', wordBreak: 'break-all' }}>{org.email}</span>
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
