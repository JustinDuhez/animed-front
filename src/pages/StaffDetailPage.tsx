import { useState, useEffect, useMemo } from 'react'
import { doc, onSnapshot, updateDoc, collection } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { UserRecord, UserType } from '../data/user.js'
import { USER_TYPES, USER_TYPE_META } from '../data/user.js'
import type { Session } from '../data/session.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'
import EmptyState from '../components/ui/EmptyState.js'
import { formatFullDate, formatSessionLabel } from '../utils/format.js'
import { useRole } from '../context/RoleContext.js'

const ROLE_META: Record<string, { label: string; cls: string }> = {
  admin:  { label: 'Administrateur', cls: 'badge-alerte' },
  editor: { label: 'Éditeur',        cls: 'badge-terra'  },
  viewer: { label: 'Lecteur',        cls: 'badge-repos'  },
}

interface Props {
  id:              string
  onBack:          () => void
  onSelectSession: (id: string, label: string) => void
}

export default function StaffDetailPage({ id, onBack, onSelectSession }: Props) {
  const role     = useRole()
  const isAdmin  = role === 'admin'
  const canWrite = role === 'admin' || role === 'editor'

  const [user,     setUser]     = useState<UserRecord | null | undefined>(undefined)
  const [sessions, setSessions] = useState<Session[]>([])
  const [editing,  setEditing]  = useState(false)
  const [draft,    setDraft]    = useState<Partial<UserRecord> | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [saveError,setSaveError]= useState('')

  useEffect(() => {
    return onSnapshot(doc(db, 'users', id), snap => {
      setUser(snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserRecord) : null)
    })
  }, [id])

  useEffect(() => {
    return onSnapshot(collection(db, 'sessions'), snap => {
      setSessions(snap.docs.map(d => d.data() as Session))
    })
  }, [])

  function startEditing() {
    if (!user) return
    setDraft({ ...user })
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
      const { uid, createdAt, ...updateFields } = draft as UserRecord
      await updateDoc(doc(db, 'users', id), updateFields as any)
      setEditing(false)
      setDraft(null)
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof UserRecord>(field: K, value: UserRecord[K]) {
    setDraft(d => d ? { ...d, [field]: value } : d)
  }

  const userSessions = useMemo(() => {
    if (!user) return []
    return sessions
      .filter(s => s.handler === user.displayName)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [sessions, user])

  const upcoming = useMemo(() => {
    const now = new Date()
    return userSessions
      .filter(s => s.status === 'planned' && new Date(s.date) > now)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [userSessions])

  const recent = useMemo(() =>
    userSessions.filter(s => s.status === 'completed').slice(0, 5)
  , [userSessions])

  if (user === undefined) return <EmptyState icon="🥼" title="Chargement…" />
  if (!user) {
    return (
      <EmptyState
        icon="🥼"
        title="Intervenant introuvable"
        description="Cet utilisateur n'existe pas ou a été supprimé."
        action={<button className="btn btn-secondary" onClick={onBack}>Retour aux intervenants</button>}
      />
    )
  }

  const display   = (editing && draft ? { ...user, ...draft } : user) as UserRecord
  const typeMeta  = display.type ? USER_TYPE_META[display.type] : null
  const roleMeta  = ROLE_META[display.role] ?? ROLE_META.viewer
  const totalCount     = userSessions.length
  const plannedCount   = userSessions.filter(s => s.status === 'planned').length
  const completedCount = userSessions.filter(s => s.status === 'completed').length
  const cancelledCount = userSessions.filter(s => s.status === 'cancelled').length

  return (
    <>
      <PageHeader
        title={`🥼 ${display.displayName || display.email}`}
        subtitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            {typeMeta && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: typeMeta.bg, color: typeMeta.color }}>
                {typeMeta.label}
              </span>
            )}
            {display.acacedCertified && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>
                ACACED
              </span>
            )}
          </div>
        }
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
            <div className="card-header"><div className="card-title">Profil</div></div>
            <div className="card-body">
              <div className="info-grid">

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Nom affiché</div>
                  {editing && draft
                    ? <input className="form-input" type="text" value={draft.displayName ?? ''} onChange={e => setField('displayName', e.target.value)} style={{ marginTop: 4 }} />
                    : <div className="info-value">{display.displayName || '—'}</div>}
                </div>

                <div className="info-tile">
                  <div className="info-label">Spécialité</div>
                  {editing && draft
                    ? <select className="form-select" value={draft.type ?? ''} onChange={e => setField('type', (e.target.value as UserType) || undefined as any)} style={{ marginTop: 4 }}>
                        <option value="">— Non définie —</option>
                        {USER_TYPES.map(t => <option key={t} value={t}>{USER_TYPE_META[t].label}</option>)}
                      </select>
                    : <div className="info-value">
                        {typeMeta
                          ? <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: typeMeta.bg, color: typeMeta.color }}>{typeMeta.label}</span>
                          : <span style={{ color: 'var(--slate-400)' }}>—</span>}
                      </div>}
                </div>

                <div className="info-tile">
                  <div className="info-label">Rôle système</div>
                  {editing && draft && isAdmin
                    ? <select className="form-select" value={draft.role ?? display.role} onChange={e => setField('role', e.target.value as UserRecord['role'])} style={{ marginTop: 4 }}>
                        <option value="viewer">Lecteur</option>
                        <option value="editor">Éditeur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    : <div className="info-value">
                        <span className={`badge ${roleMeta.cls}`}><span className="badge-dot" />{roleMeta.label}</span>
                      </div>}
                </div>

                <div className="info-tile">
                  <div className="info-label">Téléphone</div>
                  {editing && draft
                    ? <input className="form-input" type="text" value={draft.phone ?? ''} onChange={e => setField('phone', e.target.value || undefined as any)} placeholder="ex : 06 12 34 56 78" style={{ marginTop: 4 }} />
                    : <div className="info-value">{display.phone ? `📞 ${display.phone}` : '—'}</div>}
                </div>

                <div className="info-tile">
                  <div className="info-label">Email</div>
                  <div className="info-value" style={{ wordBreak: 'break-all' }}>{display.email ? `✉ ${display.email}` : '—'}</div>
                </div>

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Certification ACACED</div>
                  {editing && draft
                    ? <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={draft.acacedCertified ?? false} onChange={e => setField('acacedCertified', e.target.checked)} style={{ width: 16, height: 16 }} />
                        <span style={{ fontSize: 13, color: 'var(--slate-700)' }}>Certifié ACACED</span>
                      </label>
                    : <div className="info-value">
                        {display.acacedCertified
                          ? <span className="badge badge-actif"><span className="badge-dot" />Certifié</span>
                          : <span className="badge badge-repos"><span className="badge-dot" />Non certifié</span>}
                      </div>}
                </div>

              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Notes</div></div>
            <div className="card-body">
              {editing && draft
                ? <textarea className="form-input" value={draft.notes ?? ''} onChange={e => setField('notes', e.target.value || undefined as any)} rows={5} style={{ resize: 'vertical' }} placeholder="Disponibilités, spécificités, remarques…" />
                : display.notes
                  ? <p style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6, margin: 0 }}>{display.notes}</p>
                  : <p style={{ fontSize: 13, color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>Aucune note renseignée.</p>}
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
                {upcoming.length === 0
                  ? <p style={{ fontSize: 12, color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>Aucune séance planifiée.</p>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                      {upcoming.slice(0, 5).map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--slate-50)', borderRadius: 8, cursor: 'pointer' }}
                          onClick={() => onSelectSession(s.id, formatSessionLabel(s.date))}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-900)', textTransform: 'capitalize' }}>{formatFullDate(s.date)}</div>
                            {s.structure && <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 1 }}>{s.structure}</div>}
                          </div>
                          <span className="badge badge-repos" style={{ flexShrink: 0, marginLeft: 'var(--sp-2)' }}><span className="badge-dot" />Planifiée</span>
                        </div>
                      ))}
                    </div>}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-2)' }}>
                  Récentes
                </div>
                {recent.length === 0
                  ? <p style={{ fontSize: 12, color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>Aucune séance effectuée.</p>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                      {recent.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--slate-50)', borderRadius: 8, cursor: 'pointer' }}
                          onClick={() => onSelectSession(s.id, formatSessionLabel(s.date))}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-900)', textTransform: 'capitalize' }}>{formatFullDate(s.date)}</div>
                            {s.structure && <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 1 }}>{s.structure}</div>}
                          </div>
                          <span className="badge badge-actif" style={{ flexShrink: 0, marginLeft: 'var(--sp-2)' }}><span className="badge-dot" />Effectuée</span>
                        </div>
                      ))}
                    </div>}
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  )
}
