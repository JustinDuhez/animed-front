import { useState, useEffect } from 'react'
import { doc, onSnapshot, updateDoc, query, collection, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal, Status, Vaccine, Session } from '../data/animals.js'

type Tab = 'infos' | 'seances' | 'sante' | 'documents'


const STATUS_BADGE: Record<Animal['status'], { cls: string; label: string }> = {
  actif:    { cls: 'badge-actif',    label: 'Actif' },
  repos:    { cls: 'badge-repos',    label: 'Repos' },
  alerte:   { cls: 'badge-alerte',   label: 'Alerte' },
  retraite: { cls: 'badge-retraite', label: 'Retraité' },
}

const SESSION_STATUS: Record<Session['status'], { cls: string; label: string }> = {
  completed: { cls: 'badge-actif',    label: 'Effectuée' },
  planned:   { cls: 'badge-repos',    label: 'Planifiée' },
  cancelled: { cls: 'badge-alerte',   label: 'Annulée'   },
}

const EMOJI_OPTIONS = ['🐕', '🐈', '🐇', '🐴', '🦜', '🐑', '🐄', '🐓', '🐠', '🦎', '🐢', '🐿️']

interface Props {
  id: string
  onBack: () => void
}

export default function AnimalDetailPage({ id, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('infos')
  const [animal, setAnimal] = useState<Animal | null | undefined>(undefined)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Animal | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [sessionRecords, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(doc(db, 'animals', id), snap => {
      setAnimal(snap.exists() ? (snap.data() as Animal) : null)
    })
  }, [id])

  useEffect(() => {
    const q = query(collection(db, 'sessions'), where('animalId', '==', id))
    return onSnapshot(q, snap => {
      const records = snap.docs
        .map(d => d.data() as Session)
        .sort((a, b) => b.date.localeCompare(a.date))
      setSessions(records)
      setSessionsLoading(false)
    })
  }, [id])

  function startEditing() {
    if (!animal) return
    setDraft({ ...animal, vaccines: animal.vaccines.map(v => ({ ...v })), establishments: [...animal.establishments] })
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
      const validVaccines = draft.vaccines.filter(v => v.name.trim())
      const vaccineOk = validVaccines.length > 0 && validVaccines.every(v => v.status === 'ok')
      const updated: Animal = { ...draft, vaccines: validVaccines, vaccineOk }
      await updateDoc(doc(db, 'animals', id), updated as unknown as Record<string, unknown>)
      setEditing(false)
      setDraft(null)
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof Animal>(field: K, value: Animal[K]) {
    setDraft(d => d ? { ...d, [field]: value } : d)
  }

  function updateVaccine(i: number, field: keyof Vaccine, value: string) {
    setDraft(d => {
      if (!d) return d
      const vaccines = d.vaccines.map((v, idx) => idx === i ? { ...v, [field]: value } : v)
      return { ...d, vaccines }
    })
  }
  function addVaccine() {
    setDraft(d => d ? { ...d, vaccines: [...d.vaccines, { name: '', status: 'ok' as const, info: '' }] } : d)
  }
  function removeVaccine(i: number) {
    setDraft(d => d ? { ...d, vaccines: d.vaccines.filter((_, idx) => idx !== i) } : d)
  }

  function updateEstablishment(i: number, value: string) {
    setDraft(d => {
      if (!d) return d
      const establishments = d.establishments.map((e, idx) => idx === i ? value : e)
      return { ...d, establishments }
    })
  }
  function addEstablishment() {
    setDraft(d => d ? { ...d, establishments: [...d.establishments, ''] } : d)
  }
  function removeEstablishment(i: number) {
    setDraft(d => d ? { ...d, establishments: d.establishments.filter((_, idx) => idx !== i) } : d)
  }

  if (animal === undefined) {
    return <div className="empty-state"><div className="empty-icon">🐾</div><div className="empty-title">Chargement…</div></div>
  }
  if (!animal) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🐾</div>
        <div className="empty-title">Animal introuvable</div>
        <div className="empty-text">Cet animal n'existe pas ou a été supprimé.</div>
        <button className="btn btn-secondary" onClick={onBack}>Retour à la liste</button>
      </div>
    )
  }

  const d = editing && draft ? draft : animal
  const { cls: statusCls, label: statusLabel } = STATUS_BADGE[d.status]
  const hasAlert = d.status === 'alerte' || !d.vaccineOk
  const expiredVaccines = animal.vaccines.filter(v => v.status === 'expired' || v.status === 'soon')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'infos',     label: 'Informations' },
    { key: 'seances',   label: 'Séances',   count: sessionsLoading ? undefined : sessionRecords.length || undefined },
    { key: 'sante',     label: 'Santé',     count: expiredVaccines.length || undefined },
    { key: 'documents', label: 'Documents' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{d.name}</h1>
          <p className="page-subtitle">{d.species} · {d.gender} · {d.id}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={cancelEditing} disabled={saving}>Annuler</button>
              <button className="btn btn-primary" onClick={saveEditing} disabled={saving}>
                {saving ? 'Enregistrement…' : '✓ Enregistrer'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary">📋 Protocole</button>
              <button className="btn btn-secondary">📤 Exporter</button>
              <button className="btn btn-primary" onClick={startEditing}>✏ Modifier</button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--sp-5)' }}>
          <span className="alert-icon">✕</span>
          <div className="alert-body"><div className="alert-title">{saveError}</div></div>
        </div>
      )}

      {/* Hero */}
      <div className="detail-hero">
        <div className="hero-avatar">{animal.emoji}</div>
        <div style={{ flex: 1 }}>
          <div className="hero-name">{animal.name}</div>
          <div className="hero-meta">
            {d.species} · {d.gender} · né(e) le {d.birthDate}
          </div>
          <div className="hero-badges">
            <span className={`hero-badge hero-badge-status ${d.status}`}>{statusLabel}</span>
            <span className="hero-badge">{d.id}</span>
            {d.chipId !== '—' && <span className="hero-badge">Puce {d.chipId}</span>}
            {hasAlert && <span className="hero-badge hero-badge-alert">⚠ Alerte sanitaire</span>}
          </div>
        </div>
        <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.12)', color: 'white', borderColor: 'rgba(255,255,255,.2)', flexShrink: 0 }}>
          📱 QR Code
        </button>
      </div>

      {/* Content */}
      <div className="detail-layout">

        {/* Left — tabs + content */}
        <div className="card" style={{ overflow: 'visible' }}>
          <div style={{ borderBottom: '1px solid var(--slate-100)', padding: '0 var(--sp-5)' }}>
            <div className="tab-nav">
              {tabs.map(t => (
                <div key={t.key} className={`tab-item${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
                  {t.label}
                  {t.count !== undefined && <span className="tab-count">{t.count}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="card-body">
            {activeTab === 'infos' && (
              <>
                <div className="info-grid">

                  {editing && draft && (
                    <div className="info-tile" style={{ gridColumn: '1 / -1' }}>
                      <div className="info-label">Emoji</div>
                      <div className="emoji-picker" style={{ marginTop: 6 }}>
                        {EMOJI_OPTIONS.map(e => (
                          <button key={e} type="button" className={`emoji-btn${draft.emoji === e ? ' active' : ''}`}
                            onClick={() => setField('emoji', e)}>{e}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="info-tile">
                    <div className="info-label">Nom</div>
                    {editing && draft
                      ? <input className="form-input" type="text" value={draft.name} onChange={e => setField('name', e.target.value)} style={{ marginTop: 4 }} />
                      : <div className="info-value">{d.name}</div>}
                  </div>

                  <div className="info-tile">
                    <div className="info-label">Espèce</div>
                    {editing && draft
                      ? <input className="form-input" type="text" value={draft.species} onChange={e => setField('species', e.target.value)} style={{ marginTop: 4 }} />
                      : <div className="info-value">{d.species}</div>}
                  </div>

                  <div className="info-tile">
                    <div className="info-label">Sexe</div>
                    {editing && draft
                      ? <select className="form-select" value={draft.gender} onChange={e => setField('gender', e.target.value as 'Mâle' | 'Femelle')} style={{ marginTop: 4 }}>
                          <option value="Mâle">Mâle</option>
                          <option value="Femelle">Femelle</option>
                        </select>
                      : <div className="info-value">{d.gender}</div>}
                  </div>

                  <div className="info-tile">
                    <div className="info-label">Date de naissance</div>
                    {editing && draft
                      ? <input className="form-input" type="date" value={draft.birthDate === '—' ? '' : draft.birthDate} onChange={e => setField('birthDate', e.target.value || '—')} style={{ marginTop: 4 }} />
                      : <div className="info-value">{d.birthDate}</div>}
                  </div>

                  <div className="info-tile">
                    <div className="info-label">Poids</div>
                    {editing && draft
                      ? <input className="form-input" type="text" value={draft.weight === '—' ? '' : draft.weight} onChange={e => setField('weight', e.target.value || '—')} style={{ marginTop: 4 }} />
                      : <div className="info-value">{d.weight}</div>}
                  </div>

                  <div className="info-tile">
                    <div className="info-label">Dernier contrôle vét.</div>
                    {editing && draft
                      ? <input className="form-input" type="date" value={draft.lastVetCheck === '—' ? '' : draft.lastVetCheck} onChange={e => setField('lastVetCheck', e.target.value || '—')} style={{ marginTop: 4 }} />
                      : <div className="info-value">{d.lastVetCheck}</div>}
                  </div>

                  <div className={`info-tile${!d.vaccineOk ? ' info-tile-alert' : ''}`}>
                    <div className="info-label">Vaccinations</div>
                    <div className="info-value" style={{ color: d.vaccineOk ? 'var(--green-600)' : 'var(--red-500)', fontSize: 13 }}>
                      {d.vaccineOk ? '✓ À jour' : '✕ Attention requise'}
                    </div>
                    <div className="info-sub">
                      {d.vaccines.length === 0
                        ? 'Aucun vaccin renseigné'
                        : d.vaccines.filter(v => v.status !== 'ok').length > 0
                          ? `${d.vaccines.filter(v => v.status !== 'ok').length} vaccin(s) à renouveler`
                          : 'Tous les vaccins sont valides'}
                    </div>
                  </div>

                  <div className="info-tile">
                    <div className="info-label">Antiparasitaire</div>
                    {editing && draft ? (
                      <>
                        <label className="form-checkbox-row" style={{ marginTop: 6 }}>
                          <input type="checkbox" className="table-check" checked={draft.antiparasiteOk} onChange={e => setField('antiparasiteOk', e.target.checked)} />
                          {draft.antiparasiteOk ? 'Actif' : 'Non renseigné'}
                        </label>
                        {draft.antiparasiteOk && (
                          <input className="form-input" type="text" value={draft.antiparasiteInfo} onChange={e => setField('antiparasiteInfo', e.target.value)} style={{ marginTop: 6 }} />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="info-value" style={{ color: d.antiparasiteOk ? 'var(--green-600)' : 'var(--amber-600)', fontSize: 13 }}>
                          {d.antiparasiteOk ? '✓ Actif' : '⚠ Non renseigné'}
                        </div>
                        <div className="info-sub">{d.antiparasiteInfo}</div>
                      </>
                    )}
                  </div>

                  <div className="info-tile">
                    <div className="info-label">Vermifuge (jours restants)</div>
                    {editing && draft
                      ? <input className="form-input" type="number" min="0" value={draft.vermifugeDaysLeft ?? ''} onChange={e => setField('vermifugeDaysLeft', e.target.value === '' ? null : parseInt(e.target.value, 10))} style={{ marginTop: 4 }} />
                      : <div className="info-value" style={{ fontSize: 13 }}>
                          {d.vermifugeDaysLeft === null
                            ? <span style={{ color: 'var(--slate-400)' }}>—</span>
                            : d.vermifugeDaysLeft < 30
                            ? <span style={{ color: 'var(--amber-600)' }}>⚠ Dans {d.vermifugeDaysLeft} jours</span>
                            : <span style={{ color: 'var(--green-600)' }}>✓ Dans {d.vermifugeDaysLeft} jours</span>}
                        </div>}
                  </div>

                  <div className="info-tile">
                    <div className="info-label">Intervenant référent</div>
                    {editing && draft
                      ? <input className="form-input" type="text" value={draft.handler === '—' ? '' : draft.handler} onChange={e => setField('handler', e.target.value || '—')} style={{ marginTop: 4 }} />
                      : <div className="info-value" style={{ fontSize: 13 }}>
                          {d.handler === '—' ? <span style={{ color: 'var(--slate-400)' }}>—</span> : d.handler}
                        </div>}
                  </div>

                  <div className="info-tile">
                    <div className="info-label">Séances ce mois</div>
                    {editing && draft
                      ? <input className="form-input" type="number" min="0"
                          value={draft.sessions[new Date().toISOString().slice(0, 7)] ?? 0}
                          onChange={e => {
                            const key = new Date().toISOString().slice(0, 7)
                            setField('sessions', { ...draft.sessions, [key]: parseInt(e.target.value) || 0 })
                          }}
                          style={{ marginTop: 4 }} />
                      : <div className="info-value">{d.sessions[new Date().toISOString().slice(0, 7)] ?? 0}</div>}
                    {!editing && <div className="info-sub">Dernière : {d.lastSession}</div>}
                  </div>

                  {editing && draft && (
                    <div className="info-tile">
                      <div className="info-label">Dernière séance</div>
                      <input className="form-input" type="date" value={draft.lastSession === '—' ? '' : draft.lastSession} onChange={e => setField('lastSession', e.target.value || '—')} style={{ marginTop: 4 }} />
                    </div>
                  )}

                  <div className="info-tile">
                    <div className="info-label">Puce électronique</div>
                    {editing && draft
                      ? <input className="form-input" type="text" value={draft.chipId === '—' ? '' : draft.chipId} onChange={e => setField('chipId', e.target.value || '—')} style={{ marginTop: 4 }} />
                      : <div className="info-value" style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 5 }}>{d.chipId}</div>}
                  </div>

                </div>

                {/* Establishments */}
                <div style={{ marginTop: 'var(--sp-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                    <div className="info-label">Établissements autorisés</div>
                    {editing && draft && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addEstablishment}>+ Ajouter</button>
                    )}
                  </div>
                  {editing && draft ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                      {draft.establishments.length === 0 && (
                        <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>Aucun établissement</div>
                      )}
                      {draft.establishments.map((est, i) => (
                        <div key={i} style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                          <input className="form-input" type="text" value={est} onChange={e => updateEstablishment(i, e.target.value)} style={{ flex: 1 }} />
                          <button type="button" className="td-action-btn danger" onClick={() => removeEstablishment(i)}>🗑</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                      {d.establishments.length === 0
                        ? <span style={{ fontSize: 13, color: 'var(--slate-400)' }}>—</span>
                        : d.establishments.map(e => <span key={e} className="badge badge-terra">{e}</span>)}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'seances' && (
              <>
                <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
                  {[
                    { value: String(sessionRecords.length), label: 'Séances totales' },
                    { value: String(animal.sessions),       label: 'Ce mois-ci' },
                    { value: animal.lastSession,            label: 'Dernière séance' },
                  ].map(stat => (
                    <div key={stat.label} style={{ flex: 1, textAlign: 'center', padding: 'var(--sp-4)', background: 'var(--slate-50)', borderRadius: 'var(--radius)', border: '1px solid var(--slate-100)' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--slate-900)' }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {sessionsLoading ? (
                  <div style={{ textAlign: 'center', padding: 'var(--sp-6)', color: 'var(--slate-400)', fontSize: 13 }}>Chargement…</div>
                ) : sessionRecords.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--sp-8) var(--sp-4)' }}>
                    <div className="empty-icon">📋</div>
                    <div className="empty-title">Aucune séance enregistrée</div>
                    <div className="empty-text">Les séances de {animal.name} apparaîtront ici.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                    {sessionRecords.map(s => {
                      const { cls, label } = SESSION_STATUS[s.status]
                      return (
                        <div key={s.id} style={{ padding: 'var(--sp-4)', border: '1px solid var(--slate-100)', borderRadius: 'var(--radius)', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)' }}>
                              {new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <span className={`badge ${cls}`}><span className="badge-dot" />{label}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--sp-4)', fontSize: 12, color: 'var(--slate-600)' }}>
                            {s.structure && <span>🏛 {s.structure}</span>}
                            {s.handler   && <span>👤 {s.handler}</span>}
                          </div>
                          {s.notes && (
                            <div style={{ marginTop: 'var(--sp-2)', fontSize: 12, color: 'var(--slate-500)', fontStyle: 'italic' }}>
                              {s.notes}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab !== 'infos' && activeTab !== 'seances' && (
              <div className="empty-state" style={{ padding: 'var(--sp-10) var(--sp-6)' }}>
                <div className="empty-icon">{activeTab === 'sante' ? '🩺' : '📄'}</div>
                <div className="empty-title">Section en construction</div>
                <div className="empty-text">Cette section sera disponible prochainement.</div>
              </div>
            )}
          </div>
        </div>

        {/* Right — sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          {/* Next session */}
          <div className="card">
            <div className="card-header"><div className="card-title">Prochaine séance</div></div>
            <div className="card-body">
              {editing && draft ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  <div>
                    <div className="info-label" style={{ marginBottom: 4 }}>Structure</div>
                    <input className="form-input" type="text" placeholder="ex: EHPAD Les Jardins"
                      value={draft.nextSession?.structure ?? ''}
                      onChange={e => setField('nextSession', e.target.value ? { structure: e.target.value, date: draft.nextSession?.date ?? '' } : null)} />
                  </div>
                  <div>
                    <div className="info-label" style={{ marginBottom: 4 }}>Date et heure</div>
                    <input className="form-input" type="datetime-local"
                      value={draft.nextSession?.date ?? ''}
                      onChange={e => setField('nextSession', e.target.value ? { structure: draft.nextSession?.structure ?? '', date: e.target.value } : null)} />
                  </div>
                </div>
              ) : d.nextSession ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)' }}>{d.nextSession.structure}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 3 }}>{d.nextSession.date}</div>
                  <div style={{ marginTop: 'var(--sp-3)', display: 'flex', gap: 'var(--sp-2)' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Voir</button>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Modifier</button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--sp-3) 0' }}>
                  <div style={{ fontSize: 12, color: 'var(--slate-400)', marginBottom: 'var(--sp-3)' }}>Aucune séance planifiée</div>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>+ Planifier une séance</button>
                </div>
              )}
            </div>
          </div>

          {/* Vaccine status */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Statut sanitaire</div>
              {editing && draft && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={addVaccine}>+ Vaccin</button>
              )}
              {!editing && !d.vaccineOk && (
                <span className="badge badge-alerte" style={{ fontSize: 10 }}><span className="badge-dot" />Action requise</span>
              )}
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {editing && draft ? (
                <>
                  {draft.vaccines.length === 0 && (
                    <div style={{ fontSize: 13, color: 'var(--slate-400)', textAlign: 'center' }}>Aucun vaccin</div>
                  )}
                  {draft.vaccines.map((v, i) => (
                    <div key={i} className="vaccine-row">
                      <input className="form-input" type="text" placeholder="Vaccin" value={v.name} onChange={e => updateVaccine(i, 'name', e.target.value)} style={{ flex: 2 }} />
                      <select className="form-select" value={v.status} onChange={e => updateVaccine(i, 'status', e.target.value)} style={{ flex: 1 }}>
                        <option value="ok">À jour</option>
                        <option value="soon">Bientôt</option>
                        <option value="expired">Expiré</option>
                      </select>
                      <input className="form-input" type="text" placeholder="Info" value={v.info} onChange={e => updateVaccine(i, 'info', e.target.value)} style={{ flex: 2 }} />
                      <button type="button" className="td-action-btn danger" onClick={() => removeVaccine(i)}>🗑</button>
                    </div>
                  ))}
                  <div className="tb-dropdown-divider" style={{ margin: '2px 0' }} />
                  <label className="form-checkbox-row">
                    <input type="checkbox" className="table-check" checked={draft.antiparasiteOk} onChange={e => setField('antiparasiteOk', e.target.checked)} />
                    Antiparasitaire actif
                  </label>
                </>
              ) : (
                <>
                  {d.vaccines.map(v => {
                    const map = { ok: { label: '✓ OK', color: 'var(--green-600)' }, soon: { label: '⚠ Bientôt', color: 'var(--amber-600)' }, expired: { label: '✕ Expiré', color: 'var(--red-500)' } }
                    const { label, color } = map[v.status]
                    return (
                      <div key={v.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                        <span style={{ color: 'var(--slate-600)' }}>{v.name}</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color }}>{label}</span>
                          <div style={{ fontSize: 10, color: 'var(--slate-400)', marginTop: 1 }}>{v.info}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="tb-dropdown-divider" style={{ margin: '2px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--slate-600)' }}>Antiparasitaire</span>
                    <span style={{ fontWeight: 700, color: d.antiparasiteOk ? 'var(--green-600)' : 'var(--amber-600)' }}>
                      {d.antiparasiteOk ? '✓ Actif' : '⚠ Non renseigné'}
                    </span>
                  </div>
                  {!d.vaccineOk && (
                    <button className="btn btn-warning btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--sp-1)' }}>
                      Mettre à jour
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Statut</div>
              <span className={`badge ${statusCls}`}><span className="badge-dot" />{statusLabel}</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {editing && draft ? (
                <select className="form-select" value={draft.status} onChange={e => setField('status', e.target.value as Status)}>
                  <option value="actif">Actif</option>
                  <option value="repos">Repos</option>
                  <option value="alerte">Alerte</option>
                  <option value="retraite">Retraité</option>
                </select>
              ) : (
                <>
                  <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Mettre en repos</button>
                  {d.status !== 'retraite' && (
                    <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', color: 'var(--slate-500)' }}>Mettre à la retraite</button>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
