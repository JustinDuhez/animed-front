import { useState, useEffect, FormEvent } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal } from '../data/animal.js'
import type { Organization } from '../data/organization.js'
import type { Session } from '../data/session.js'
import type { StaffMember } from '../data/staff.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'

interface Props {
  onBack: () => void
  onSaved: () => void
  preselectedAnimalId?: string
}

export default function AddSessionPage({ onBack, onSaved, preselectedAnimalId }: Props) {
  const [animals,    setAnimals]    = useState<Animal[]>([])
  const [orgs,       setOrgs]       = useState<Organization[]>([])
  const [staff,      setStaff]      = useState<StaffMember[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const [animalIds,  setAnimalIds]  = useState<Set<string>>(preselectedAnimalId ? new Set([preselectedAnimalId]) : new Set())
  const [date,       setDate]       = useState('')
  const [structure,  setStructure]  = useState('')
  const [handler,    setHandler]    = useState('')
  const [status,     setStatus]     = useState<Session['status']>('planned')
  const [notes,      setNotes]      = useState('')

  useEffect(() => {
    const unsubAnimals = onSnapshot(collection(db, 'animals'), snap => {
      setAnimals(
        snap.docs
          .map(d => d.data() as Animal)
          .filter(a => a.status !== 'retraite')
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      )
    })
    const unsubOrgs = onSnapshot(collection(db, 'organizations'), snap => {
      setOrgs(
        snap.docs
          .map(d => d.data() as Organization)
          .filter(o => o.status === 'active')
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      )
    })
    const unsubStaff = onSnapshot(collection(db, 'staff'), snap => {
      setStaff(
        snap.docs
          .map(d => d.data() as StaffMember)
          .filter(m => m.status === 'active')
          .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'))
      )
    })
    return () => { unsubAnimals(); unsubOrgs(); unsubStaff() }
  }, [])

  function toggleAnimal(id: string) {
    setAnimalIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (animalIds.size === 0) { setError('Veuillez sélectionner au moins un animal.'); return }
    if (!date)                { setError('La date est requise.'); return }
    if (!structure.trim())    { setError('La structure est requise.'); return }

    setSubmitting(true)
    setError('')
    try {
      const id = `ses-${Date.now()}`
      const session: Session = {
        id,
        animalIds: [...animalIds],
        date,
        structure: structure.trim(),
        handler:   handler.trim(),
        notes:     notes.trim(),
        status,
      }
      await setDoc(doc(db, 'sessions', id), session)
      onSaved()
    } catch {
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Nouvelle séance"
        subtitle="Remplissez les informations pour planifier une séance"
      >
        <button type="button" className="btn btn-secondary" onClick={onBack}>Annuler</button>
        <button form="add-session-form" type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : '✓ Enregistrer'}
        </button>
      </PageHeader>

      {error && <AlertBanner title={error} />}

      <form id="add-session-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', maxWidth: 680 }}>

          {/* Animals + date */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Animaux <span className="form-required">*</span></div>
              {animalIds.size > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-600)' }}>
                  {animalIds.size} sélectionné{animalIds.size > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', maxHeight: 220, overflowY: 'auto' }}>
                {animals.map(a => (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 8, cursor: 'pointer', background: animalIds.has(a.id) ? 'var(--green-50, #f0fdf4)' : 'transparent', border: `1px solid ${animalIds.has(a.id) ? 'var(--green-200, #bbf7d0)' : 'var(--slate-100)'}` }}>
                    <input
                      type="checkbox"
                      className="table-check"
                      checked={animalIds.has(a.id)}
                      onChange={() => toggleAnimal(a.id)}
                    />
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{a.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-900)' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{a.species}</div>
                    </div>
                  </label>
                ))}
                {animals.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--slate-400)', textAlign: 'center', padding: 'var(--sp-3)' }}>
                    Aucun animal disponible
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Séance details */}
          <div className="card">
            <div className="card-header"><div className="card-title">Séance</div></div>
            <div className="card-body">
              <div className="form-grid">

                <div className="form-field">
                  <label className="form-label">Statut</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Session['status'])}>
                    <option value="planned">Planifiée</option>
                    <option value="inProgress">En cours</option>
                    <option value="completed">Effectuée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>

                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Date et heure <span className="form-required">*</span></label>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Structure + handler */}
          <div className="card">
            <div className="card-header"><div className="card-title">Lieu &amp; intervenant</div></div>
            <div className="card-body">
              <div className="form-grid">

                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Structure <span className="form-required">*</span></label>
                  <select
                    className="form-select"
                    value={structure}
                    onChange={e => setStructure(e.target.value)}
                  >
                    <option value="">— Sélectionner une structure —</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.name}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Intervenant</label>
                  <select className="form-select" value={handler} onChange={e => setHandler(e.target.value)}>
                    <option value="">— Sélectionner un intervenant —</option>
                    {staff.map(m => {
                      const fullName = `${m.firstName} ${m.lastName}`
                      return <option key={m.id} value={fullName}>{fullName}</option>
                    })}
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header"><div className="card-title">Notes</div></div>
            <div className="card-body">
              <div className="form-field" style={{ margin: 0 }}>
                <textarea
                  className="form-input"
                  placeholder="Observations, comportement de l'animal, retours des participants…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

        </div>
      </form>
    </>
  )
}
