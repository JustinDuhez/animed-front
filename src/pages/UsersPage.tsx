import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { UserRecord, Role } from '../data/user.js'
import { ROLE_BADGE, ROLE_LABELS } from '../utils/badges.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'
import EmptyState from '../components/ui/EmptyState.js'
import { formatShortDate } from '../utils/format.js'

export default function UsersPage() {
  const [users,   setUsers]   = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState<string | null>(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'users'),
      snap => {
        setUsers(
          snap.docs
            .map(d => ({ uid: d.id, ...d.data() } as UserRecord))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        )
        setLoading(false)
      },
      err => { setError(err.message); setLoading(false) },
    )
  }, [])

  async function handleRoleChange(uid: string, role: Role) {
    setSaving(uid)
    setError('')
    try {
      await updateDoc(doc(db, 'users', uid), { role })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <EmptyState icon="👥" title="Chargement…" />

  return (
    <>
      <PageHeader title="👥 Utilisateurs" subtitle="Gestion des accès et des rôles" />

      {error && <AlertBanner title={error} />}

      <div className="card">
        <div className="card-header"><div className="card-title">Comptes</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--slate-100)' }}>
                {['Utilisateur', 'Rôle', 'Membre depuis'].map(h => (
                  <th key={h} style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const { bg, color } = ROLE_BADGE[u.role]
                return (
                  <tr key={u.uid} style={{ borderBottom: '1px solid var(--slate-50)' }}>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-900)' }}>
                        {u.displayName || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 2 }}>{u.email}</div>
                    </td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                      <select
                        value={u.role}
                        disabled={saving === u.uid}
                        onChange={e => handleRoleChange(u.uid, e.target.value as Role)}
                        style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: bg, color, border: 'none', cursor: 'pointer' }}
                      >
                        {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 12, color: 'var(--slate-500)' }}>
                      {formatShortDate(u.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 'var(--sp-3)' }}>
        Les changements de rôle sont appliqués immédiatement. Le premier administrateur doit être défini manuellement dans la console Firebase.
      </p>
    </>
  )
}
