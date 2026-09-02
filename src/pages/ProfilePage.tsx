import { useState, useEffect } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import type { UserRecord, UserType } from '../data/user.js'
import { USER_TYPES, USER_TYPE_META } from '../data/user.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'
import EmptyState from '../components/ui/EmptyState.js'
import { useRole } from '../context/RoleContext.js'

const ROLE_LABELS: Record<string, string> = {
  admin:  'Administrateur',
  editor: 'Éditeur',
  viewer: 'Lecteur',
}

export default function ProfilePage() {
  const role = useRole()

  const [user,      setUser]      = useState<UserRecord | null | undefined>(undefined)
  const [editing,   setEditing]   = useState(false)
  const [draft,     setDraft]     = useState<Partial<UserRecord> | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved,     setSaved]     = useState(false)

  const uid = auth.currentUser?.uid

  useEffect(() => {
    if (!uid) return
    return onSnapshot(doc(db, 'users', uid), snap => {
      setUser(snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserRecord) : null)
    })
  }, [uid])

  function startEditing() {
    if (!user) return
    setDraft({ ...user })
    setEditing(true)
    setSaveError('')
    setSaved(false)
  }

  function cancelEditing() {
    setEditing(false)
    setDraft(null)
    setSaveError('')
  }

  async function saveEditing() {
    if (!draft || !uid) return
    setSaving(true)
    setSaveError('')
    try {
      const { uid: _uid, createdAt, role: _role, ...updateFields } = draft as UserRecord
      await updateDoc(doc(db, 'users', uid), updateFields as any)
      setEditing(false)
      setDraft(null)
      setSaved(true)
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof UserRecord>(field: K, value: UserRecord[K]) {
    setDraft(d => d ? { ...d, [field]: value } : d)
  }

  if (user === undefined) return <EmptyState icon="👤" title="Chargement…" />
  if (!user) return <EmptyState icon="👤" title="Profil introuvable" />

  const display  = (editing && draft ? { ...user, ...draft } : user) as UserRecord
  const typeMeta = display.type ? USER_TYPE_META[display.type] : null

  return (
    <>
      <PageHeader
        title="Mon profil"
        subtitle={`${display.email} · ${ROLE_LABELS[display.role] ?? display.role}`}
      >
        {editing ? (
          <>
            <button className="btn btn-secondary" onClick={cancelEditing} disabled={saving}>Annuler</button>
            <button className="btn btn-primary" onClick={saveEditing} disabled={saving}>
              {saving ? 'Enregistrement…' : '✓ Enregistrer'}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={startEditing}>✏ Modifier</button>
        )}
      </PageHeader>

      {saveError && <AlertBanner title={saveError} />}
      {saved && !editing && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--sp-4)' }}>
          <span className="alert-icon">✓</span>
          <div className="alert-body"><p className="alert-text">Profil mis à jour.</p></div>
        </div>
      )}

      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

        <div className="card">
          <div className="card-header"><div className="card-title">Informations personnelles</div></div>
          <div className="card-body">
            <div className="info-grid">

              <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                <div className="info-label">Nom affiché</div>
                {editing && draft
                  ? <input className="form-input" type="text" value={draft.displayName ?? ''} onChange={e => setField('displayName', e.target.value)} style={{ marginTop: 4 }} placeholder="Marie Dupont" />
                  : <div className="info-value">{display.displayName || '—'}</div>}
              </div>

              <div className="info-tile">
                <div className="info-label">Adresse e-mail</div>
                <div className="info-value" style={{ wordBreak: 'break-all', color: 'var(--slate-500)' }}>{display.email}</div>
              </div>

              <div className="info-tile">
                <div className="info-label">Téléphone</div>
                {editing && draft
                  ? <input className="form-input" type="text" value={draft.phone ?? ''} onChange={e => setField('phone', e.target.value || undefined as any)} placeholder="ex : 06 12 34 56 78" style={{ marginTop: 4 }} />
                  : <div className="info-value">{display.phone ? `📞 ${display.phone}` : '—'}</div>}
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
              ? <textarea className="form-input" value={draft.notes ?? ''} onChange={e => setField('notes', e.target.value || undefined as any)} rows={4} style={{ resize: 'vertical' }} placeholder="Disponibilités, spécificités, remarques…" />
              : display.notes
                ? <p style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6, margin: 0 }}>{display.notes}</p>
                : <p style={{ fontSize: 13, color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>Aucune note renseignée.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Compte</div></div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-tile">
                <div className="info-label">Rôle</div>
                <div className="info-value" style={{ color: 'var(--slate-500)', fontSize: 12 }}>
                  {ROLE_LABELS[role ?? ''] ?? '—'}
                  <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 2 }}>Le rôle est géré par un administrateur.</div>
                </div>
              </div>
              <div className="info-tile">
                <div className="info-label">Membre depuis</div>
                <div className="info-value" style={{ color: 'var(--slate-500)' }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
