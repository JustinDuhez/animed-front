import { useState, useEffect, useMemo } from 'react'
import { doc, onSnapshot, updateDoc, collection } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Organization, OrgType } from '../data/organization.js'
import type { Session } from '../data/session.js'

const TYPE_META: Record<OrgType, { label: string; bg: string; color: string; icon: string }> = {
  ehpad:    { label: 'EHPAD',    bg: '#dcfce7', color: '#15803d', icon: '🏡' },
  ime:      { label: 'IME',      bg: '#e0e7ff', color: '#4338ca', icon: '🏫' },
  clinique: { label: 'Clinique', bg: '#e0f2fe', color: '#0369a1', icon: '🏥' },
  creche:   { label: 'Crèche',   bg: '#fff7ed', color: '#c2410c', icon: '🧸' },
  hopital:  { label: 'Hôpital',  bg: '#fee2e2', color: '#b91c1c', icon: '🏥' },
  ecole:    { label: 'École',    bg: '#fef9c3', color: '#a16207', icon: '🎒' },
  autre:    { label: 'Autre',    bg: '#f1f5f9', color: '#475569', icon: '🏢' },
}

const TYPE_OPTIONS: { value: OrgType; label: string }[] = [
  { value: 'ehpad',    label: 'EHPAD' },
  { value: 'ime',      label: 'IME (Institut Médico-Éducatif)' },
  { value: 'clinique', label: 'Clinique' },
  { value: 'creche',   label: 'Crèche' },
  { value: 'hopital',  label: 'Hôpital' },
  { value: 'ecole',    label: 'École' },
  { value: 'autre',    label: 'Autre' },
]

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function sessionLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'long' })} · ${formatTime(iso)}`
}

interface Props {
  id: string
  onBack: () => void
  onSelectSession: (id: string, label: string) => void
}

export default function OrganizationDetailPage({ id, onBack, onSelectSession }: Props) {
  const [org,       setOrg]       = useState<Organization | null | undefined>(undefined)
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [editing,   setEditing]   = useState(false)
  const [draft,     setDraft]     = useState<Organization | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    return onSnapshot(doc(db, 'organizations', id), snap => {
      setOrg(snap.exists() ? (snap.data() as Organization) : null)
    })
  }, [id])

  useEffect(() => {
    return onSnapshot(collection(db, 'sessions'), snap => {
      setSessions(snap.docs.map(d => d.data() as Session))
    })
  }, [])

  function startEditing() {
    if (!org) return
    setDraft({ ...org })
    setEditing(true)
    setSaveError('')
  }

  function cancelEditing() {
    setEditing(false)
    setDraft(null)
    setSaveError('')
  }

  async function saveEditing() {
    if (!draft) return
    setSaving(true)
    setSaveError('')
    try {
      await updateDoc(doc(db, 'organizations', id), draft as any)
      setEditing(false)
      setDraft(null)
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof Organization>(field: K, value: Organization[K]) {
    setDraft(d => d ? { ...d, [field]: value } : d)
  }

  const orgSessions = useMemo(() => {
    if (!org) return []
    return sessions
      .filter(s => s.structure === org.name)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [sessions, org?.name])

  const upcoming = useMemo(() => {
    const now = new Date()
    return orgSessions
      .filter(s => s.status === 'planned' && new Date(s.date) > now)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [orgSessions])

  const recent = useMemo(() =>
    orgSessions.filter(s => s.status === 'completed').slice(0, 5)
  , [orgSessions])

  if (org === undefined) {
    return <div className="empty-state"><div className="empty-icon">🏥</div><div className="empty-title">Chargement…</div></div>
  }
  if (!org) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏥</div>
        <div className="empty-title">Structure introuvable</div>
        <div className="empty-text">Cette structure n'existe pas ou a été supprimée.</div>
        <button className="btn btn-secondary" onClick={onBack}>Retour aux structures</button>
      </div>
    )
  }

  const display = editing && draft ? draft : org
  const { label, bg, color, icon } = TYPE_META[display.type]
  const totalCount     = orgSessions.length
  const plannedCount   = orgSessions.filter(s => s.status === 'planned').length
  const completedCount = orgSessions.filter(s => s.status === 'completed').length
  const cancelledCount = orgSessions.filter(s => s.status === 'cancelled').length

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{icon} {display.name}</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg, color }}>
              {label}
            </span>
            {display.address && <span>· {display.address}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={cancelEditing} disabled={saving}>Annuler</button>
              <button className="btn btn-primary"   onClick={saveEditing}   disabled={saving}>
                {saving ? 'Enregistrement…' : '✓ Enregistrer'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
              <button className="btn btn-primary"   onClick={startEditing}>✏ Modifier</button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--sp-5)' }}>
          <span className="alert-icon">✕</span>
          <div className="alert-body"><div className="alert-title">{saveError}</div></div>
        </div>
      )}

      <div className="detail-layout">

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          <div className="card">
            <div className="card-header"><div className="card-title">Informations</div></div>
            <div className="card-body">
              <div className="info-grid">

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Nom</div>
                  {editing && draft ? (
                    <input
                      className="form-input"
                      type="text"
                      value={draft.name}
                      onChange={e => setField('name', e.target.value)}
                      style={{ marginTop: 4 }}
                    />
                  ) : (
                    <div className="info-value">{display.name}</div>
                  )}
                </div>

                <div className="info-tile">
                  <div className="info-label">Type</div>
                  {editing && draft ? (
                    <select className="form-select" value={draft.type} onChange={e => setField('type', e.target.value as OrgType)} style={{ marginTop: 4 }}>
                      {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <div className="info-value">
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg, color }}>
                        {label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="info-tile">
                  <div className="info-label">Statut</div>
                  {editing && draft ? (
                    <select className="form-select" value={draft.status} onChange={e => setField('status', e.target.value as Organization['status'])} style={{ marginTop: 4 }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  ) : (
                    <div className="info-value">
                      {display.status === 'active'
                        ? <span className="badge badge-actif"><span className="badge-dot" />Active</span>
                        : <span className="badge badge-repos"><span className="badge-dot" />Inactive</span>
                      }
                    </div>
                  )}
                </div>

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Adresse</div>
                  {editing && draft ? (
                    <input
                      className="form-input"
                      type="text"
                      value={draft.address}
                      onChange={e => setField('address', e.target.value)}
                      placeholder="ex : 12 rue des Lilas, 75014 Paris"
                      style={{ marginTop: 4 }}
                    />
                  ) : (
                    <div className="info-value">{display.address ? `📍 ${display.address}` : '—'}</div>
                  )}
                </div>

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Référent</div>
                  {editing && draft ? (
                    <input
                      className="form-input"
                      type="text"
                      value={draft.contact}
                      onChange={e => setField('contact', e.target.value)}
                      placeholder="ex : Mme D. Lambert"
                      style={{ marginTop: 4 }}
                    />
                  ) : (
                    <div className="info-value">{display.contact ? `👤 ${display.contact}` : '—'}</div>
                  )}
                </div>

                <div className="info-tile">
                  <div className="info-label">Téléphone</div>
                  {editing && draft ? (
                    <input
                      className="form-input"
                      type="text"
                      value={draft.phone}
                      onChange={e => setField('phone', e.target.value)}
                      placeholder="ex : 01 45 23 67 89"
                      style={{ marginTop: 4 }}
                    />
                  ) : (
                    <div className="info-value">{display.phone ? `📞 ${display.phone}` : '—'}</div>
                  )}
                </div>

                <div className="info-tile">
                  <div className="info-label">Email</div>
                  {editing && draft ? (
                    <input
                      className="form-input"
                      type="email"
                      value={draft.email}
                      onChange={e => setField('email', e.target.value)}
                      placeholder="ex : contact@structure.fr"
                      style={{ marginTop: 4 }}
                    />
                  ) : (
                    <div className="info-value" style={{ wordBreak: 'break-all' }}>{display.email ? `✉ ${display.email}` : '—'}</div>
                  )}
                </div>

              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Notes</div></div>
            <div className="card-body">
              {editing && draft ? (
                <textarea
                  className="form-input"
                  value={draft.notes}
                  onChange={e => setField('notes', e.target.value)}
                  rows={5}
                  style={{ resize: 'vertical' }}
                  placeholder="Informations complémentaires, conditions d'accès, particularités…"
                />
              ) : display.notes ? (
                <p style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6, margin: 0 }}>{display.notes}</p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>Aucune note renseignée.</p>
              )}
            </div>
          </div>

        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          <div className="card">
            <div className="card-header"><div className="card-title">Séances</div></div>
            <div className="card-body">

              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
                {[
                  { value: totalCount,     label: 'Total'      },
                  { value: plannedCount,   label: 'Planif.'    },
                  { value: completedCount, label: 'Effectuées' },
                  { value: cancelledCount, label: 'Annulées'   },
                ].map(item => (
                  <div key={item.label} style={{ flex: 1, textAlign: 'center', padding: 'var(--sp-2)', background: 'var(--slate-50)', borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1 }}>{item.value}</div>
                    <div style={{ fontSize: 9, color: 'var(--slate-400)', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-2)' }}>
                  Prochaines
                </div>
                {upcoming.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>Aucune séance planifiée.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                    {upcoming.slice(0, 5).map(s => (
                      <div
                        key={s.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--slate-50)', borderRadius: 8, cursor: 'pointer' }}
                        onClick={() => onSelectSession(s.id, sessionLabel(s.date))}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-900)', textTransform: 'capitalize' }}>
                            {formatFullDate(s.date)}
                          </div>
                          {s.handler && <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 1 }}>{s.handler}</div>}
                        </div>
                        <span className="badge badge-repos" style={{ flexShrink: 0, marginLeft: 'var(--sp-2)' }}><span className="badge-dot" />Planifiée</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-2)' }}>
                  Récentes
                </div>
                {recent.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>Aucune séance effectuée.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                    {recent.map(s => (
                      <div
                        key={s.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--slate-50)', borderRadius: 8, cursor: 'pointer' }}
                        onClick={() => onSelectSession(s.id, sessionLabel(s.date))}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-900)', textTransform: 'capitalize' }}>
                            {formatFullDate(s.date)}
                          </div>
                          {s.handler && <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 1 }}>{s.handler}</div>}
                        </div>
                        <span className="badge badge-actif" style={{ flexShrink: 0, marginLeft: 'var(--sp-2)' }}><span className="badge-dot" />Effectuée</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Référence</div></div>
            <div className="card-body">
              <div className="info-tile" style={{ margin: 0 }}>
                <div className="info-label">Identifiant</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--slate-500)', marginTop: 4, wordBreak: 'break-all' }}>
                  {org.id}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
