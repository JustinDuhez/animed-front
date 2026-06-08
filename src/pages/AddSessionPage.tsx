import { useState, useEffect, FormEvent } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal, Organization, Session } from '../data/animals.js'

interface Props {
  onBack: () => void
  onSaved: () => void
}

export default function AddSessionPage({ onBack, onSaved }: Props) {
  const [animals,    setAnimals]    = useState<Animal[]>([])
  const [orgs,       setOrgs]       = useState<Organization[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const [animalId,  setAnimalId]  = useState('')
  const [date,      setDate]      = useState('')
  const [structure, setStructure] = useState('')
  const [handler,   setHandler]   = useState('')
  const [status,    setStatus]    = useState<Session['status']>('planned')
  const [notes,     setNotes]     = useState('')

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
    return () => { unsubAnimals(); unsubOrgs() }
  }, [])

  function handleAnimalChange(id: string) {
    setAnimalId(id)
    setStructure('')
    const animal = animals.find(a => a.id === id)
    setHandler(animal && animal.handler !== '—' ? animal.handler : '')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!animalId)        { setError('Veuillez sélectionner un animal.'); return }
    if (!date)            { setError('La date est requise.'); return }
    if (!structure.trim()) { setError('La structure est requise.'); return }

    setSubmitting(true)
    setError('')
    try {
      const id = `ses-${animalId.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`
      const session: Session = {
        id,
        animalId,
        date,
        structure: structure.trim(),
        handler: handler.trim(),
        notes: notes.trim(),
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouvelle séance</h1>
          <p className="page-subtitle">Remplissez les informations pour planifier une séance</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          <button type="button" className="btn btn-secondary" onClick={onBack}>Annuler</button>
          <button form="add-session-form" type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Enregistrement…' : '✓ Enregistrer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--sp-5)' }}>
          <span className="alert-icon">✕</span>
          <div className="alert-body"><div className="alert-title">{error}</div></div>
        </div>
      )}

      <form id="add-session-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', maxWidth: 680 }}>

          {/* Animal + date */}
          <div className="card">
            <div className="card-header"><div className="card-title">Séance</div></div>
            <div className="card-body">
              <div className="form-grid">

                <div className="form-field">
                  <label className="form-label">Animal <span className="form-required">*</span></label>
                  <select
                    className="form-select"
                    value={animalId}
                    onChange={e => handleAnimalChange(e.target.value)}
                    required
                  >
                    <option value="">— Sélectionner un animal —</option>
                    {animals.map(a => (
                      <option key={a.id} value={a.id}>{a.emoji} {a.name} · {a.species}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Statut</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Session['status'])}>
                    <option value="planned">Planifiée</option>
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
                  <input
                    className="form-input"
                    type="text"
                    placeholder="ex: S. Durand"
                    value={handler}
                    onChange={e => setHandler(e.target.value)}
                  />
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
