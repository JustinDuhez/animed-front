import { useState, FormEvent } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { StaffMember, StaffType } from '../data/staff.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'

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
  onBack:  () => void
  onSaved: (id: string, name: string) => void
}

export default function AddStaffPage({ onBack, onSaved }: Props) {
  const [submitting,      setSubmitting]      = useState(false)
  const [error,           setError]           = useState('')

  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]        = useState('')
  const [type,            setType]            = useState<StaffType>('educateur')
  const [status,          setStatus]          = useState<StaffMember['status']>('active')
  const [phone,           setPhone]           = useState('')
  const [email,           setEmail]           = useState('')
  const [acacedCertified, setAcacedCertified] = useState(false)
  const [notes,           setNotes]           = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) { setError('Le prénom est requis.'); return }
    if (!lastName.trim())  { setError('Le nom est requis.');    return }

    setSubmitting(true)
    setError('')
    try {
      const slug = `${firstName}-${lastName}`
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const id = `staff-${slug}-${Date.now()}`
      const member: StaffMember = {
        id,
        firstName:       firstName.trim(),
        lastName:        lastName.trim(),
        type,
        status,
        phone:           phone.trim(),
        email:           email.trim(),
        acacedCertified,
        notes:           notes.trim(),
      }
      await setDoc(doc(db, 'staff', id), member)
      onSaved(id, `${member.firstName} ${member.lastName}`)
    } catch {
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Nouvel intervenant"
        subtitle="Renseignez les informations du membre de l'équipe"
      >
        <button type="button" className="btn btn-secondary" onClick={onBack}>Annuler</button>
        <button form="add-staff-form" type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : '✓ Enregistrer'}
        </button>
      </PageHeader>

      {error && <AlertBanner title={error} />}

      <form id="add-staff-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', maxWidth: 680 }}>

          {/* Identité */}
          <div className="card">
            <div className="card-header"><div className="card-title">Identité</div></div>
            <div className="card-body">
              <div className="form-grid">

                <div className="form-field">
                  <label className="form-label">Prénom <span className="form-required">*</span></label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="ex : Marie"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Nom <span className="form-required">*</span></label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="ex : Dupont"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Spécialité <span className="form-required">*</span></label>
                  <select className="form-select" value={type} onChange={e => setType(e.target.value as StaffType)}>
                    {TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Statut</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value as StaffMember['status'])}>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="card">
            <div className="card-header"><div className="card-title">Contact</div></div>
            <div className="card-body">
              <div className="form-grid">

                <div className="form-field">
                  <label className="form-label">Téléphone</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="ex : 06 12 34 56 78"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="ex : marie.dupont@example.fr"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Certification */}
          <div className="card">
            <div className="card-header"><div className="card-title">Certification</div></div>
            <div className="card-body">
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acacedCertified}
                  onChange={e => setAcacedCertified(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-800)' }}>Certifié ACACED</div>
                  <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 2 }}>
                    Attestation de Connaissances pour les Animaux de Compagnie d'Espèces Domestiques
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header"><div className="card-title">Notes</div></div>
            <div className="card-body">
              <div className="form-field" style={{ margin: 0 }}>
                <textarea
                  className="form-input"
                  placeholder="Informations complémentaires, disponibilités, spécificités…"
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
