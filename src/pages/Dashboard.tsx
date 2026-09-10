import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal } from '../data/animal.js'
import type { Session } from '../data/session.js'
import type { Organization } from '../data/organization.js'
import KpiCard from '../components/ui/KpiCard.js'
import SessionCard from '../components/ui/SessionCard.js'
import EmptyState from '../components/ui/EmptyState.js'
import AlertBanner from '../components/ui/AlertBanner.js'
import { formatSessionLabel, formatShortDate, isOverdue } from '../utils/format.js'
import { requiresVaccineAlert } from '../utils/badges.js'

interface Props {
  onSelectAnimal:  (id: string, name: string) => void
  onAddSession:    () => void
  onSelectSession: (id: string, label: string) => void
  onViewAlerts:    () => void
}

export default function Dashboard({ onSelectAnimal, onAddSession, onSelectSession, onViewAlerts }: Props) {
  const [animals,  setAnimals]  = useState<Animal[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [orgs,     setOrgs]     = useState<Organization[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let loaded = 0
    const check = () => { if (++loaded === 3) setLoading(false) }
    const u1 = onSnapshot(collection(db, 'animals'),       snap => { setAnimals(snap.docs.map(d => d.data() as Animal));      check() })
    const u2 = onSnapshot(collection(db, 'sessions'),      snap => { setSessions(snap.docs.map(d => d.data() as Session));    check() })
    const u3 = onSnapshot(collection(db, 'organizations'), snap => { setOrgs(snap.docs.map(d => d.data() as Organization));   check() })
    return () => { u1(); u2(); u3() }
  }, [])

  const now          = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

  const animalMap = useMemo(() => {
    const m: Record<string, Animal> = {}
    animals.forEach(a => { m[a.id] = a })
    return m
  }, [animals])

  // ── KPI values ──────────────────────────────────────────────────
  const activeAnimals  = animals.filter(a => a.status === 'actif').length
  const alertAnimals   = animals.filter(a => a.status === 'alerte' || (!a.vaccineOk && requiresVaccineAlert(a.emoji)))
  const alertCount     = alertAnimals.length
  const vaccineAlerts  = alertAnimals.filter(a => !a.vaccineOk && requiresVaccineAlert(a.emoji)).length
  const statusAlerts   = alertAnimals.filter(a => a.status === 'alerte').length
  const activeOrgs     = orgs.filter(o => o.status === 'active').length
  const uniqueHandlers = new Set(animals.filter(a => a.handler !== '—').map(a => a.handler)).size

  const thisMonthCount = sessions.filter(s => s.date.slice(0, 7) === currentMonth).length
  const lastMonthCount = sessions.filter(s => s.date.slice(0, 7) === lastMonth).length
  const completedMonth = sessions.filter(s => s.date.slice(0, 7) === currentMonth && s.status === 'completed').length
  const plannedFuture  = sessions.filter(s => s.status === 'planned' && new Date(s.date) >= now).length

  const sessionDiff       = thisMonthCount - lastMonthCount
  const sessionTrend      = sessionDiff > 0 ? 'up' : sessionDiff < 0 ? 'down' : 'flat'
  const sessionTrendLabel = sessionDiff > 0 ? `↑ +${sessionDiff}` : sessionDiff < 0 ? `↓ ${sessionDiff}` : '→ ='

  const weeklyCounts  = [0, 1, 2, 3].map(w => {
    const start = w * 7 + 1
    const end   = w === 3 ? 31 : (w + 1) * 7
    return sessions.filter(s => {
      if (s.date.slice(0, 7) !== currentMonth) return false
      const day = new Date(s.date).getDate()
      return day >= start && day <= end
    }).length
  })
  const maxWeekly     = Math.max(...weeklyCounts, 1)
  const sessionSparks = weeklyCounts.map(c => Math.max(Math.round(c / maxWeekly * 100), 5))

  const orgTypesLabel: Record<string, string> = { ehpad: 'EHPAD', ime: 'IME', clinique: 'Clinique', creche: 'Crèche', hopital: 'Hôpital', ecole: 'École', autre: 'Autre' }
  const orgTypesSub = [...new Set(orgs.filter(o => o.status === 'active').map(o => o.type))].slice(0, 3).map(t => orgTypesLabel[t] ?? t).join(', ')

  // ── Lists ────────────────────────────────────────────────────────
  const recentAnimals = [...animals]
    .sort((a, b) => {
      const aAlert = (a.status === 'alerte' || (!a.vaccineOk && requiresVaccineAlert(a.emoji))) ? 1 : 0
      const bAlert = (b.status === 'alerte' || (!b.vaccineOk && requiresVaccineAlert(b.emoji))) ? 1 : 0
      if (bAlert !== aAlert) return bAlert - aAlert
      if (a.lastSession === '—' && b.lastSession !== '—') return 1
      if (b.lastSession === '—' && a.lastSession !== '—') return -1
      return b.lastSession.localeCompare(a.lastSession)
    })
    .slice(0, 5)

  const upcomingSessions = sessions
    .filter(s => s.status === 'planned' && new Date(s.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const todayLabel = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const todayCapitalized = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)

  if (loading) return <EmptyState icon="🐾" title="Chargement…" />

  const kpiCards = [
    { icon: '🐾', iconColor: 'green',  value: String(activeAnimals),  label: 'Animaux actifs',        sub: `${animals.length} au total · ${animals.filter(a => a.status === 'repos').length} en repos` },
    { icon: '⚠️', iconColor: 'amber',  value: String(alertCount),     label: 'Alertes sanitaires',     sub: alertCount > 0 ? `${vaccineAlerts} vaccin${vaccineAlerts > 1 ? 's' : ''} · ${statusAlerts} statut critique` : 'Aucune alerte active' },
    { icon: '🏥', iconColor: 'blue',   value: String(activeOrgs),     label: 'Structures partenaires', sub: orgTypesSub || 'Aucune structure' },
    { icon: '🥼', iconColor: 'green',  value: String(uniqueHandlers), label: 'Intervenants actifs',    sub: 'Déduits des fiches animaux' },
    { icon: '📅', iconColor: 'terra',  value: String(thisMonthCount), label: 'Séances ce mois',        sub: `${completedMonth} effectuée${completedMonth > 1 ? 's' : ''} · ${plannedFuture} planifiée${plannedFuture > 1 ? 's' : ''}`, trend: sessionTrend, trendLabel: sessionTrendLabel, sparks: sessionSparks, sparkColor: 'var(--terra-300)' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">{todayCapitalized}</p>
        </div>
      </div>

      {alertCount > 0 && (
        <AlertBanner
          icon="⚠"
          title={`${alertCount} alerte${alertCount > 1 ? 's' : ''} sanitaire${alertCount > 1 ? 's' : ''} nécessite${alertCount === 1 ? '' : 'nt'} votre attention`}
          description={`${alertAnimals.slice(0, 3).map(a => a.name).join(', ')}${alertCount > 3 ? ` et ${alertCount - 3} autre${alertCount - 3 > 1 ? 's' : ''}` : ''} — vérifiez les vaccinations avant les prochaines séances.`}
          action={<button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={onViewAlerts}>Voir les alertes</button>}
        />
      )}

      {/* KPI grid */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        {kpiCards.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--sp-5)', alignItems: 'start' }}>

        {/* Animals table */}
        <div className="table-wrapper">
          <div className="table-toolbar">
            <div className="card-title" style={{ marginRight: 'auto' }}>Animaux — alertes &amp; récents</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Animal</th>
                <th>Espèce</th>
                <th>Statut</th>
                <th>Vaccin</th>
                <th>Séances / mois</th>
                <th>Dernière séance</th>
                <th>Entretien box</th>
                <th>Intervenant</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentAnimals.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: 'var(--sp-6)' }}>Aucun animal</td></tr>
              ) : recentAnimals.map(a => (
                <tr key={a.id}>
                  <td className="td-primary">
                    <div className="td-cell-animal" style={{ cursor: 'pointer' }} onClick={() => onSelectAnimal(a.id, a.name)}>
                      <div className="td-av">{a.emoji}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                        <div className="td-mono">{a.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--slate-600)' }}>{a.species}</td>
                  <td>
                    <span className={`badge ${{ actif: 'badge-actif', repos: 'badge-repos', alerte: 'badge-alerte', retraite: 'badge-retraite' }[a.status] ?? 'badge-neutral'}`}>
                      <span className="badge-dot" />{{ actif: 'Actif', repos: 'Repos', alerte: 'Alerte', retraite: 'Retraité' }[a.status] ?? a.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${a.vaccineOk ? 'badge-actif' : requiresVaccineAlert(a.emoji) ? 'badge-alerte' : 'badge-repos'}`}>
                      <span className="badge-dot" />{a.vaccineOk ? 'À jour' : requiresVaccineAlert(a.emoji) ? 'Attention' : 'N/A'}
                    </span>
                  </td>
                  <td>{a.sessions[currentMonth] ?? 0}</td>
                  <td style={{ color: a.lastSession === '—' ? 'var(--slate-300)' : 'var(--slate-500)' }}>{formatShortDate(a.lastSession)}</td>
                  <td>
                    {a.penMaintenance ? (
                      <span style={{ color: isOverdue(a.penMaintenance, 15) ? 'var(--red-500)' : 'var(--green-600)', fontSize: 12, fontWeight: 600 }}>
                        {isOverdue(a.penMaintenance, 15) ? '⚠ ' : '✓ '}{formatShortDate(a.penMaintenance)}
                      </span>
                    ) : <span style={{ color: 'var(--slate-300)' }}>—</span>}
                  </td>
                  <td style={{ color: a.handler === '—' ? 'var(--slate-300)' : 'var(--slate-600)' }}>{a.handler}</td>
                  <td className="td-actions">
                    <button className="td-action-btn" title="Voir la fiche" onClick={() => onSelectAnimal(a.id, a.name)}>🔗</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-pagination">
            <span className="pag-info">
              {animals.length === 0 ? 'Aucun animal' : `Affichage ${Math.min(5, animals.length)} sur ${animals.length} animaux · alertes en premier`}
            </span>
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Séances à venir</div>
              <div className="card-subtitle">{plannedFuture} planifiée{plannedFuture > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {upcomingSessions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, padding: 'var(--sp-4) 0' }}>
                Aucune séance planifiée
              </div>
            ) : upcomingSessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                animals={s.animalIds.map(id => animalMap[id]).filter((a): a is Animal => !!a)}
                onClick={() => onSelectSession(s.id, formatSessionLabel(s.date))}
              />
            ))}
          </div>
          <div className="card-footer">
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onAddSession}>
              + Planifier une séance
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
