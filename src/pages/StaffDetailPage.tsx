import { useState, useEffect, useMemo } from 'react'
import { doc, onSnapshot, updateDoc, collection } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { StaffMember, StaffType } from '../data/staff.js'
import type { Session } from '../data/session.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'
import EmptyState from '../components/ui/EmptyState.js'
import { formatFullDate, formatSessionLabel } from '../utils/format.js'
import { useRole } from '../context/RoleContext.js'

const TYPE_META: Record<StaffType, { label: string; bg: string; color: string }> = {
  educateur:        { label: 'Éducateur spécialisé', bg: '#e0e7ff', color: '#4338ca' },
  psychologue:      { label: 'Psychologue',          bg: '#fce7f3', color: '#9d174d' },
  infirmier:        { label: 'Infirmier(ère)',        bg: '#e0f2fe', color: '#0369a1' },
  kinesitherapeute: { label: 'Kinésithérapeute',     bg: '#dcfce7', color: '#15803d' },
  veterinaire:      { label: 'Vétérinaire',          bg: '#fff7ed', color: '#c2410c' },
  benevole:         { label: 'Bénévole',             bg: '#fef9c3', color: '#a16207' },
  autre:            { label: 'Autre',                bg: '#f1f5f9', color: '#475569' },
}

const TYPE_OPTIONS: { value: StaffType; label: string }[] = [
  { value: 'educateur',        label: 'Éducateur spécialisé' },
  { value: 'psychologue',      label: 'Psychologue' },
  { value: 'infirmier',        label: 'Infirmier(ère)' },
  { value: 'kinesitherapeute', label: 'Kinésithérapeute' },
  { value: 'veterinaire',      label: 'Vétérinaire' },
  { value: 'benevole',         label: 'Bénévole' },
  { value: 'autre',            label: 'Autre' },
]

interface Props {
  id:              string
  onBack:          () => void
  onSelectSession: (id: string, label: string) => void
}

export default function StaffDetailPage({ id, onBack, onSelectSession }: Props) {
  const role     = useRole()
  const canWrite = role === 'admin' || role === 'editor'

  const [member,    setMember]    = useState<StaffMember | null | undefined>(undefined)
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [editing,   setEditing]   = useState(false)
  const [draft,     setDraft]     = useState<StaffMember | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    return onSnapshot(doc(db, 'staff', id), snap => {
      setMember(snap.exists() ? (snap.data() as StaffMember) : null)
    })
  }, [id])

  useEffect(() => {
    return onSnapshot(collection(db, 'sessions'), snap => {
      setSessions(snap.docs.map(d => d.data() as Session))
    })
  }, [])

  function startEditing() {
    if (!member) return
    setDraft({ ...member })
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
      await updateDoc(doc(db, 'staff', id), draft as any)
      setEditing(false)
      setDraft(null)
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof StaffMember>(field: K, value: StaffMember[K]) {
    setDraft(d => d ? { ...d, [field]: value } : d)
  }

  const memberSessions = useMemo(() => {
    if (!member) return []
    const fullName = `${member.firstName} ${member.lastName}`
    return sessions
      .filter(s => s.handler === fullName)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [sessions, member])

  const upcoming = useMemo(() => {
    const now = new Date()
    return memberSessions
      .filter(s => s.status === 'planned' && new Date(s.date) > now)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [memberSessions])

  const recent = useMemo(() =>
    memberSessions.filter(s => s.status === 'completed').slice(0, 5)
  , [memberSessions])

  if (member === undefined) return <EmptyState icon="🥼" title="Chargement…" />
  if (!member) {
    return (
      <EmptyState
        icon="🥼"
        title="Intervenant introuvable"
        description="Cet intervenant n'existe pas ou a été supprimé."
        action={<button className="btn btn-secondary" onClick={onBack}>Retour aux intervenants</button>}
      />
    )
  }

  const display = editing && draft ? draft : member
  const { label, bg, color } = TYPE_META[display.type]
  const fullName       = `${display.firstName} ${display.lastName}`
  const totalCount     = memberSessions.length
  const plannedCount   = memberSessions.filter(s => s.status === 'planned').length
  const completedCount = memberSessions.filter(s => s.status === 'completed').length
  const cancelledCount = memberSessions.filter(s => s.status === 'cancelled').length

  return (
    <>
      <PageHeader
        title={`🥼 ${fullName}`}
        subtitle={
          <>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg, color }}>
              {label}
            </span>
            {display.acacedCertified && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>
                ACACED
              </span>
            )}
          </>
        }
        subtitleStyle={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}
      >
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
            {canWrite && <button className="btn btn-primary" onClick={startEditing}>✏ Modifier</button>}
          </>
        )}
      </PageHeader>

      {saveError && <AlertBanner title={saveError} />}

      <div className="detail-layout">

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          <div className="card">
            <div className="card-header"><div className="card-title">Informations</div></div>
            <div className="card-body">
              <div className="info-grid">

                <div className="info-tile">
                  <div className="info-label">Prénom</div>
                  {editing && draft ? (
                    <input className="form-input" type="text" value={draft.firstName} onChange={e => setField('firstName', e.target.value)} style={{ marginTop: 4 }} />
                  ) : (
                    <div className="info-value">{display.firstName}</div>
                  )}
                </div>

                <div className="info-tile">
                  <div className="info-label">Nom</div>
                  {editing && draft ? (
                    <input className="form-input" type="text" value={draft.lastName} onChange={e => setField('lastName', e.target.value)} style={{ marginTop: 4 }} />
                  ) : (
                    <div className="info-value">{display.lastName}</div>
                  )}
                </div>

                <div className="info-tile">
                  <div className="info-label">Spécialité</div>
                  {editing && draft ? (
                    <select className="form-select" value={draft.type} onChange={e => setField('type', e.target.value as StaffType)} style={{ marginTop: 4 }}>
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
                    <select className="form-select" value={draft.status} onChange={e => setField('status', e.target.value as StaffMember['status'])} style={{ marginTop: 4 }}>
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  ) : (
                    <div className="info-value">
                      {display.status === 'active'
                        ? <span className="badge badge-actif"><span className="badge-dot" />Actif</span>
                        : <span className="badge badge-repos"><span className="badge-dot" />Inactif</span>
                      }
                    </div>
                  )}
                </div>

                <div className="info-tile">
                  <div className="info-label">Téléphone</div>
                  {editing && draft ? (
                    <input className="form-input" type="text" value={draft.phone} onChange={e => setField('phone', e.target.value)} placeholder="ex : 06 12 34 56 78" style={{ marginTop: 4 }} />
                  ) : (
                    <div className="info-value">{display.phone ? `📞 ${display.phone}` : '—'}</div>
                  )}
                </div>

                <div className="info-tile">
                  <div className="info-label">Email</div>
                  {editing && draft ? (
                    <input className="form-input" type="email" value={draft.email} onChange={e => setField('email', e.target.value)} placeholder="ex : marie.dupont@example.fr" style={{ marginTop: 4 }} />
                  ) : (
                    <div className="info-value" style={{ wordBreak: 'break-all' }}>{display.email ? `✉ ${display.email}` : '—'}</div>
                  )}
                </div>

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Certification ACACED</div>
                  {editing && draft ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={draft.acacedCertified} onChange={e => setField('acacedCertified', e.target.checked)} style={{ width: 16, height: 16 }} />
                      <span style={{ fontSize: 13, color: 'var(--slate-700)' }}>Certifié ACACED</span>
                    </label>
                  ) : (
                    <div className="info-value">
                      {display.acacedCertified
                        ? <span className="badge badge-actif"><span className="badge-dot" />Certifié</span>
                        : <span className="badge badge-repos"><span className="badge-dot" />Non certifié</span>
                      }
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Notes</div></div>
            <div className="card-body">
              {editing && draft ? (
                <textarea className="form-input" value={draft.notes} onChange={e => setField('notes', e.target.value)} rows={5} style={{ resize: 'vertical' }} placeholder="Disponibilités, spécificités, remarques…" />
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
                        onClick={() => onSelectSession(s.id, formatSessionLabel(s.date))}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-900)', textTransform: 'capitalize' }}>{formatFullDate(s.date)}</div>
                          {s.structure && <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 1 }}>{s.structure}</div>}
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
                        onClick={() => onSelectSession(s.id, formatSessionLabel(s.date))}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-900)', textTransform: 'capitalize' }}>{formatFullDate(s.date)}</div>
                          {s.structure && <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 1 }}>{s.structure}</div>}
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
                  {member.id}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
