import { useState, useEffect, FormEvent } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal } from '../data/animal.js'
import type { Organization } from '../data/organization.js'
import type { Session } from '../data/session.js'
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
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const [animalId,  setAnimalId]  = useState(preselectedAnimalId ?? '')
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

  useEffect(() => {
    if (!preselectedAnimalId || animals.length === 0) return
    const animal = animals.find(a => a.id === preselectedAnimalId)
    if (animal && animal.handler !== '—') setHandler(animal.handler)
  }, [animals])

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
