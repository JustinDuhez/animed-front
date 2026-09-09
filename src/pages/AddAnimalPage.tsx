import { useState, useEffect, FormEvent } from 'react'
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal, Status, Vaccine } from '../data/animal.js'
import { generateQrDataUrl } from '../utils/qrCode.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'

interface Props {
  onBack: () => void
  onSaved: (id: string, name: string) => void
}

function generateId(name: string): string {
  const prefix = name.trim().toUpperCase().replace(/[^A-Z]/gi, '').slice(0, 3).padEnd(3, 'X')
  const num = Math.floor(Math.random() * 89999) + 10001
  return `${prefix}-${String(num).padStart(5, '0')}`
}

const EMOJI_OPTIONS = ['🐕', '🐈', '🐇', '🐴', '🦜', '🐑', '🐄', '🐓', '🐠', '🦎', '🐢', '🐿️', '🐹']

export default function AddAnimalPage({ onBack, onSaved }: Props) {
  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState('')
  const [knownSpecies,  setKnownSpecies]  = useState<string[]>([])

  useEffect(() => {
    return onSnapshot(collection(db, 'animals'), snap => {
      const unique = [...new Set(snap.docs.map(d => (d.data().species as string)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'))
      setKnownSpecies(unique)
    })
  }, [])

  const [emoji, setEmoji] = useState('🐕')
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [status, setStatus] = useState<Status>('actif')
  const [gender, setGender] = useState<'Mâle' | 'Femelle'>('Mâle')
  const [birthDate, setBirthDate] = useState('')
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState('')
  const [chipId, setChipId] = useState('')

  const [handler, setHandler] = useState('')
  const [sessionsThisMonth, setSessionsThisMonth] = useState(0)
  const [lastSession, setLastSession] = useState('')
  const [lastVetCheck, setLastVetCheck] = useState('')

  const [antiparasiteOk, setAntiparasiteOk] = useState(false)
  const [antiparasiteInfo, setAntiparasiteInfo] = useState('')
  const [vermifugeLastDate, setVermifugeLastDate] = useState('')
  const [penMaintenance, setPenMaintenance] = useState('')

  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [establishments, setEstablishments] = useState<string[]>([])
  const [nextSessionStructure, setNextSessionStructure] = useState('')
  const [nextSessionDate, setNextSessionDate] = useState('')

  function addVaccine() {
    setVaccines(v => [...v, { name: '', status: 'ok', info: '' }])
  }
  function removeVaccine(i: number) {
    setVaccines(v => v.filter((_, idx) => idx !== i))
  }
  function updateVaccine(i: number, field: keyof Vaccine, value: string) {
    setVaccines(v => v.map((vac, idx) => idx === i ? { ...vac, [field]: value } : vac))
  }

  function addEstablishment() {
    setEstablishments(e => [...e, ''])
  }
  function removeEstablishment(i: number) {
    setEstablishments(e => e.filter((_, idx) => idx !== i))
  }
  function updateEstablishment(i: number, value: string) {
    setEstablishments(e => e.map((est, idx) => idx === i ? value : est))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est requis.'); return }
    if (!species.trim()) { setError("L'espèce est requise."); return }

    setSubmitting(true)
    setError('')

    try {
      const id = generateId(name)
      const validVaccines = vaccines.filter(v => v.name.trim())
      const vaccineOk = validVaccines.length > 0 && validVaccines.every(v => v.status === 'ok')
      const qrCode = await generateQrDataUrl(id)

      const animal: Animal = {
        id,
        emoji,
        name: name.trim(),
        species: species.trim(),
        status,
        gender,
        birthDate: birthDate.trim() || '—',
        ...(arrivalDate.trim() ? { arrivalDate: arrivalDate.trim() } : {}),
        weight: weight.trim() || '—',
        chipId: chipId.trim() || '—',
        handler: handler.trim() || '—',
        sessions: sessionsThisMonth > 0 ? { [new Date().toISOString().slice(0, 7)]: sessionsThisMonth } : {},
        lastSession: lastSession.trim() || '—',
        lastVetCheck: lastVetCheck.trim() || '—',
        vaccineOk,
        antiparasiteOk,
        antiparasiteInfo: antiparasiteInfo.trim() || 'Non renseigné',
        vermifugeLastDate: vermifugeLastDate.trim() || '—',
        ...(penMaintenance.trim() ? { penMaintenance: penMaintenance.trim() } : {}),
        ...(status === 'retraite' ? { retirementDate: new Date().toISOString().slice(0, 10) } : {}),
        establishments: establishments.filter(e => e.trim()),
        nextSession: nextSessionStructure.trim() && nextSessionDate.trim()
          ? { structure: nextSessionStructure.trim(), date: nextSessionDate.trim() }
          : null,
        vaccines: validVaccines,
        qrCode,
      }

      await setDoc(doc(db, 'animals', id), animal)
      onSaved(id, animal.name)
    } catch {
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Nouvel animal"
        subtitle="Remplissez les informations pour ajouter un animal au registre"
      >
        <button type="button" className="btn btn-secondary" onClick={onBack}>Annuler</button>
        <button form="add-animal-form" type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : '✓ Enregistrer'}
        </button>
      </PageHeader>

      {error && <AlertBanner title={error} />}

      <form id="add-animal-form" onSubmit={handleSubmit}>
        <div className="add-animal-layout">

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

            {/* Identité */}
            <div className="card">
              <div className="card-header"><div className="card-title">Identité</div></div>
              <div className="card-body">
                <div className="form-field">
                  <label className="form-label">Emoji</label>
                  <div className="emoji-picker">
                    {EMOJI_OPTIONS.map(e => (
                      <button
                        key={e} type="button"
                        className={`emoji-btn${emoji === e ? ' active' : ''}`}
                        onClick={() => setEmoji(e)}
                      >{e}</button>
                    ))}
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Nom <span className="form-required">*</span></label>
                    <input className="form-input" type="text" placeholder="ex: Martin" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Espèce <span className="form-required">*</span></label>
                    <input className="form-input" type="text" list="species-suggestions" placeholder="ex: Labrador Retriever" value={species} onChange={e => setSpecies(e.target.value)} required />
                    <datalist id="species-suggestions">
                      {knownSpecies.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Sexe</label>
                    <select className="form-select" value={gender} onChange={e => setGender(e.target.value as 'Mâle' | 'Femelle')}>
                      <option value="Mâle">Mâle</option>
                      <option value="Femelle">Femelle</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Date de naissance</label>
                    <input className="form-input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Date d'entrée</label>
                    <input className="form-input" type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Poids</label>
                    <input className="form-input" type="text" placeholder="ex: 28,5 kg" value={weight} onChange={e => setWeight(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Puce électronique</label>
                    <input className="form-input" type="text" placeholder="ex: 250269811234567" value={chipId} onChange={e => setChipId(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Activité */}
            <div className="card">
              <div className="card-header"><div className="card-title">Activité</div></div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Statut</label>
                    <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Status)}>
                      <option value="actif">Actif</option>
                      <option value="repos">Repos</option>
                      <option value="alerte">Alerte</option>
                      <option value="retraite">Retraité</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Intervenant référent</label>
                    <input className="form-input" type="text" placeholder="ex: S. Durand" value={handler} onChange={e => setHandler(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Séances ce mois</label>
                    <input className="form-input" type="number" min="0" value={sessionsThisMonth} onChange={e => setSessionsThisMonth(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Dernière séance</label>
                    <input className="form-input" type="date" value={lastSession} onChange={e => setLastSession(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Santé */}
            <div className="card">
              <div className="card-header"><div className="card-title">Santé</div></div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Dernier contrôle vétérinaire</label>
                    <input className="form-input" type="date" value={lastVetCheck} onChange={e => setLastVetCheck(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Vermifuge (dernier traitement)</label>
                    <input className="form-input" type="date" value={vermifugeLastDate} onChange={e => setVermifugeLastDate(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Entretien du box (dernière date)</label>
                    <input className="form-input" type="date" value={penMaintenance} onChange={e => setPenMaintenance(e.target.value)} />
                  </div>
                  <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-checkbox-row">
                      <input type="checkbox" className="table-check" checked={antiparasiteOk} onChange={e => setAntiparasiteOk(e.target.checked)} />
                      Antiparasitaire à jour
                    </label>
                    {antiparasiteOk && (
                      <input
                        className="form-input"
                        type="text"
                        placeholder="ex: Frontline · jusqu'au 30/06/2025"
                        value={antiparasiteInfo}
                        onChange={e => setAntiparasiteInfo(e.target.value)}
                        style={{ marginTop: 'var(--sp-2)' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Vaccinations */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Vaccinations</div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addVaccine}>+ Ajouter</button>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {vaccines.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--slate-400)', textAlign: 'center', padding: 'var(--sp-2) 0' }}>
                    Aucun vaccin renseigné
                  </div>
                )}
                {vaccines.map((v, i) => (
                  <div key={i} className="vaccine-row">
                    <input className="form-input" type="text" placeholder="Nom du vaccin" value={v.name} onChange={e => updateVaccine(i, 'name', e.target.value)} style={{ flex: 2 }} />
                    <select className="form-select" value={v.status} onChange={e => updateVaccine(i, 'status', e.target.value)} style={{ flex: 1 }}>
                      <option value="ok">À jour</option>
                      <option value="soon">Bientôt</option>
                      <option value="expired">Expiré</option>
                    </select>
                    <input className="form-input" type="text" placeholder="ex: Valide jusqu'au 15/01/2026" value={v.info} onChange={e => updateVaccine(i, 'info', e.target.value)} style={{ flex: 3 }} />
                    <button type="button" className="td-action-btn danger" onClick={() => removeVaccine(i)}>🗑</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

            {/* Établissements */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Établissements autorisés</div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addEstablishment}>+ Ajouter</button>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {establishments.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--slate-400)', textAlign: 'center', padding: 'var(--sp-2) 0' }}>
                    Aucun établissement
                  </div>
                )}
                {establishments.map((est, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                    <input className="form-input" type="text" placeholder="Nom de l'établissement" value={est} onChange={e => updateEstablishment(i, e.target.value)} style={{ flex: 1 }} />
                    <button type="button" className="td-action-btn danger" onClick={() => removeEstablishment(i)}>🗑</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Prochaine séance */}
            <div className="card">
              <div className="card-header"><div className="card-title">Prochaine séance</div></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <div className="form-field" style={{ margin: 0 }}>
                  <label className="form-label">Structure</label>
                  <input className="form-input" type="text" placeholder="ex: EHPAD Les Jardins" value={nextSessionStructure} onChange={e => setNextSessionStructure(e.target.value)} />
                </div>
                <div className="form-field" style={{ margin: 0 }}>
                  <label className="form-label">Date et heure</label>
                  <input className="form-input" type="datetime-local" value={nextSessionDate} onChange={e => setNextSessionDate(e.target.value)} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--slate-400)', margin: 0 }}>
                  Remplissez les deux champs pour enregistrer la prochaine séance.
                </p>
              </div>
            </div>

          </div>
        </div>
      </form>
    </>
  )
}
