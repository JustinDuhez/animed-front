import { useState, useEffect } from 'react'
import { doc, onSnapshot, updateDoc, deleteDoc, collection, writeBatch, increment, FieldValue } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal } from '../data/animal.js'
import type { Session } from '../data/session.js'
import type { Organization } from '../data/organization.js'
import type { UserRecord } from '../data/user.js'
import { SESSION_STATUS_MAP } from '../utils/badges.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'
import EmptyState from '../components/ui/EmptyState.js'
import { formatFullDate, formatTime } from '../utils/format.js'
import { useRole } from '../context/RoleContext.js'

interface Props {
  id: string
  onBack: () => void
  onSelectAnimal: (id: string, name: string) => void
}

export default function SessionDetailPage({ id, onBack, onSelectAnimal }: Props) {
  const role = useRole()
  const canWrite = role === 'admin' || role === 'editor'
  const [session,        setSession]        = useState<Session | null | undefined>(undefined)
  const [sessionAnimals, setSessionAnimals] = useState<Animal[]>([])
  const [allAnimals,     setAllAnimals]     = useState<Record<string, Animal>>({})
  const [orgs,           setOrgs]           = useState<Organization[]>([])
  const [users,          setUsers]          = useState<UserRecord[]>([])
  const [editing,           setEditing]           = useState(false)
  const [draft,             setDraft]             = useState<Session | null>(null)
  const [saving,            setSaving]            = useState(false)
  const [saveError,         setSaveError]         = useState('')

  useEffect(() => {
    return onSnapshot(doc(db, 'sessions', id), snap => {
      setSession(snap.exists() ? (snap.data() as Session) : null)
    })
  }, [id])

  useEffect(() => {
    return onSnapshot(collection(db, 'animals'), snap => {
      const map: Record<string, Animal> = {}
      snap.docs.forEach(d => { const a = d.data() as Animal; map[a.id] = a })
      setAllAnimals(map)
    })
  }, [])

  useEffect(() => {
    if (!session) return
    setSessionAnimals(session.animalIds.map(id => allAnimals[id]).filter(Boolean) as Animal[])
  }, [session, allAnimals])

  useEffect(() => {
    return onSnapshot(collection(db, 'organizations'), snap => {
      setOrgs(
        snap.docs
          .map(d => d.data() as Organization)
          .filter(o => o.status === 'active')
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      )
    })
  }, [])

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), snap => {
      setUsers(
        snap.docs
          .map(d => ({ uid: d.id, ...d.data() } as UserRecord))
          .filter(u => u.displayName)
          .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'))
      )
    })
  }, [])

  function startEditing() {
    if (!session) return
    setDraft({ ...session })
    setEditing(true)
    setSaveError('')
  }

  function cancelEditing() {
    setEditing(false)
    setDraft(null)
    setSaveError('')
  }

  async function deleteSession() {
    if (!window.confirm('Supprimer cette séance définitivement ?')) return
    await deleteDoc(doc(db, 'sessions', id))
    onBack()
  }

  async function saveEditing() {
    if (!draft) return
    setSaving(true)
    setSaveError('')
    try {
      await updateDoc(doc(db, 'sessions', id), draft as any)
      if (session?.status !== 'completed' && draft.status === 'completed') {
        await updateAnimalLastSessions(draft.animalIds, draft.date)
      }
      setEditing(false)
      setDraft(null)
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof Session>(field: K, value: Session[K]) {
    setDraft(d => d ? { ...d, [field]: value } : d)
  }

  async function updateAnimalLastSessions(animalIds: string[], sessionDate: string) {
    const month = sessionDate.slice(0, 7) // YYYY-MM
    const batch = writeBatch(db)
    for (const animalId of animalIds) {
      const current = allAnimals[animalId]?.lastSession
      const updates: Record<string, FieldValue | string> = { [`sessions.${month}`]: increment(1) }
      if (!current || current === '—' || sessionDate > current) {
        updates.lastSession = sessionDate
      }
      batch.update(doc(db, 'animals', animalId), updates)
    }
    await batch.commit()
  }

  if (session === undefined) return <EmptyState icon="📋" title="Chargement…" />
  if (!session) {
    return (
      <EmptyState
        icon="📋"
        title="Séance introuvable"
        description="Cette séance n'existe pas ou a été supprimée."
        action={<button className="btn btn-secondary" onClick={onBack}>Retour aux séances</button>}
      />
    )
  }

  const s   = editing && draft ? draft : session
  const d   = new Date(s.date)
  const now = new Date()
  const { cls, label } = SESSION_STATUS_MAP[s.status]
  const hasWarning =
    (s.status === 'planned'   && d < now) ||
    (s.status === 'completed' && d > now)

  return (
    <>
      <PageHeader
        title={`🏥 ${s.structure || 'Séance sans structure'}`}
        subtitle={`${formatFullDate(s.date)} · ${formatTime(s.date)}`}
        subtitleStyle={{ textTransform: 'capitalize' }}
      >
        {editing ? (
          <>
            <button className="btn btn-danger" onClick={deleteSession} disabled={saving}>🗑 Supprimer</button>
            <button className="btn btn-secondary" onClick={cancelEditing} disabled={saving}>Annuler</button>
            <button className="btn btn-primary"   onClick={saveEditing}   disabled={saving}>
              {saving ? 'Enregistrement…' : '✓ Enregistrer'}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
            {canWrite && <button className="btn btn-primary" onClick={startEditing}>✏ Modifier</button>}
            {canWrite && session.status !== 'completed' && (
              <button className="btn btn-primary" style={{ background: 'var(--green-600)', borderColor: 'var(--green-600)' }}
                onClick={async () => {
                  if (!window.confirm('Compléter la réalisation de cette séance ?')) return
                  await updateDoc(doc(db, 'sessions', id), { status: 'completed' })
                  await updateAnimalLastSessions(session.animalIds, session.date)
                }}>
                Compléter la séance
              </button>
            )}
          </>
        )}
      </PageHeader>

      {saveError && <AlertBanner title={saveError} />}

      <div className="detail-layout">

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Détails de la séance</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--sp-1)' }}>
                {editing && draft ? (
                  <select className="form-select" value={draft.status} onChange={e => setField('status', e.target.value as Session['status'])}>
                    <option value="planned">Planifiée</option>
                    <option value="inProgress">En cours</option>
                    <option value="completed">Effectuée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                ) : (
                  <>
                    <span className={`badge ${cls}`}><span className="badge-dot" />{label}</span>
                    {hasWarning && (
                      <span style={{ fontSize: 10, color: 'var(--amber-600)', fontWeight: 600 }}>
                        {s.status === 'planned' ? '⚠ Date dépassée' : '⚠ Date future'}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Date et heure</div>
                  {editing && draft ? (
                    <input className="form-input" type="datetime-local" value={draft.date.slice(0, 16)} onChange={e => setField('date', e.target.value + ':00')} style={{ marginTop: 4 }} />
                  ) : (
                    <div className="info-value" style={{ textTransform: 'capitalize' }}>
                      {formatFullDate(s.date)} · {formatTime(s.date)}
                    </div>
                  )}
                </div>

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Structure</div>
                  {editing && draft ? (
                    <select className="form-select" value={draft.structure} onChange={e => setField('structure', e.target.value)} style={{ marginTop: 4 }}>
                      {draft.structure && !orgs.some(o => o.name === draft.structure) && (
                        <option value={draft.structure}>{draft.structure}</option>
                      )}
                      {orgs.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                    </select>
                  ) : (
                    <div className="info-value">{s.structure || '—'}</div>
                  )}
                </div>

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">
                    {editing && draft
                      ? (draft.animalIds.length > 1 ? 'Animaux' : 'Animal')
                      : (sessionAnimals.length > 1 ? 'Animaux' : 'Animal')}
                  </div>
                  {editing && draft ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', marginTop: 4, maxHeight: 220, overflowY: 'auto' }}>
                      {Object.values(allAnimals).sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(a => {
                        const checked = draft.animalIds.includes(a.id)
                        return (
                          <label
                            key={a.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                              padding: 'var(--sp-2) var(--sp-3)', borderRadius: 8, cursor: 'pointer',
                              background: checked ? 'var(--green-50)' : 'var(--slate-50)',
                              border: `1px solid ${checked ? 'var(--green-200)' : 'var(--slate-200)'}`,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const ids = checked
                                  ? draft.animalIds.filter(id => id !== a.id)
                                  : [...draft.animalIds, a.id]
                                setField('animalIds', ids)
                              }}
                            />
                            <span style={{ fontSize: 18 }}>{a.emoji}</span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{a.species}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : sessionAnimals.length === 0 ? (
                    <div className="info-value" style={{ color: 'var(--slate-400)', marginTop: 4 }}>Aucun animal</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginTop: 4 }}>
                      {sessionAnimals.map(a => (
                        <div
                          key={a.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: 'pointer' }}
                          onClick={() => onSelectAnimal(a.id, a.name)}
                        >
                          <span style={{ fontSize: 22, lineHeight: 1 }}>{a.emoji}</span>
                          <div>
                            <div className="info-value" style={{ color: 'var(--green-600)' }}>{a.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 1 }}>{a.species}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Intervenant</div>
                  {editing && draft ? (
                    <select className="form-select" value={draft.handler} onChange={e => setField('handler', e.target.value)} style={{ marginTop: 4 }}>
                      <option value="">— Sélectionner un intervenant —</option>
                      {users.map(u => <option key={u.uid} value={u.displayName}>{u.displayName}</option>)}
                    </select>
                  ) : (
                    <div className="info-value">{s.handler || '—'}</div>
                  )}
                </div>

              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Notes</div></div>
            <div className="card-body">
              {editing && draft ? (
                <textarea className="form-input" value={draft.notes} onChange={e => setField('notes', e.target.value)} rows={5} style={{ resize: 'vertical' }} placeholder="Observations, comportement de l'animal, retours des participants…" />
              ) : s.notes ? (
                <p style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6, margin: 0 }}>{s.notes}</p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>Aucune note renseignée.</p>
              )}
            </div>
          </div>

          {session.status === 'completed' && session.survey && Object.keys(session.survey).length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">Résultats du questionnaire</div></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                  {Object.values(session.survey).map((entry, i) => {
                    const e = entry as { question?: string; answer?: unknown }
                    return (
                      <div key={i}>
                        <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 4 }}>{e.question ?? '—'}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)' }}>
                          {typeof e.answer === 'boolean'
                            ? (e.answer ? 'Oui' : 'Non')
                            : e.answer != null ? String(e.answer) : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

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
