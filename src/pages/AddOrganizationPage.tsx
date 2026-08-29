import { useState, FormEvent } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { ORG_TYPE_OPTIONS } from '../data/organization.js'
import type { OrgType, Organization } from '../data/organization.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'


interface Props {
  onBack: () => void
  onSaved: () => void
}

export default function AddOrganizationPage({ onBack, onSaved }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const [name,    setName]    = useState('')
  const [type,    setType]    = useState<OrgType>('ehpad')
  const [status,  setStatus]  = useState<Organization['status']>('active')
  const [address, setAddress] = useState('')
  const [phone,   setPhone]   = useState('')
  const [email,   setEmail]   = useState('')
  const [contact, setContact] = useState('')
  const [notes,   setNotes]   = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom de la structure est requis.'); return }

    setSubmitting(true)
    setError('')
    try {
      const slug = name.trim()
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const id = `org-${slug}-${Date.now()}`
      const org: Organization = {
        id,
        name:    name.trim(),
        type,
        status,
        address: address.trim(),
        phone:   phone.trim(),
        email:   email.trim(),
        contact: contact.trim(),
        notes:   notes.trim(),
      }
      await setDoc(doc(db, 'organizations', id), org)
      onSaved()
    } catch {
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Nouvelle structure"
        subtitle="Renseignez les informations de l'établissement partenaire"
      >
        <button type="button" className="btn btn-secondary" onClick={onBack}>Annuler</button>
        <button form="add-org-form" type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : '✓ Enregistrer'}
        </button>
      </PageHeader>

      {error && <AlertBanner title={error} />}

      <form id="add-org-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', maxWidth: 680 }}>

          {/* Identité */}
          <div className="card">
            <div className="card-header"><div className="card-title">Identité</div></div>
            <div className="card-body">
              <div className="form-grid">

                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nom <span className="form-required">*</span></label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="ex : EHPAD Les Jardins"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Type <span className="form-required">*</span></label>
                  <select className="form-select" value={type} onChange={e => setType(e.target.value as OrgType)}>
                    {ORG_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Statut</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Organization['status'])}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Adresse</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="ex : 12 rue des Lilas, 75014 Paris"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="card">
            <div className="card-header"><div className="card-title">Contact</div></div>
            <div className="card-body">
              <div className="form-grid">

                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Référent</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="ex : Mme D. Lambert"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Téléphone</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="ex : 01 45 23 67 89"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="ex : contact@structure.fr"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                  placeholder="Informations complémentaires, conditions d'accès, particularités…"
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
