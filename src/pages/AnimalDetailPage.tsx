import { useState } from 'react'
import { ANIMALS } from '../data/animals.js'
import type { Animal, Vaccine } from '../data/animals.js'

type Tab = 'infos' | 'seances' | 'sante' | 'documents'

const STATUS_BADGE: Record<Animal['status'], { cls: string; label: string }> = {
  actif:    { cls: 'badge-actif',    label: 'Actif' },
  repos:    { cls: 'badge-repos',    label: 'Repos' },
  alerte:   { cls: 'badge-alerte',   label: 'Alerte' },
  retraite: { cls: 'badge-retraite', label: 'Retraité' },
}

function VaccineRow({ v }: { v: Vaccine }) {
  const map = {
    ok:      { label: '✓ OK',     color: 'var(--green-600)' },
    soon:    { label: '⚠ Bientôt', color: 'var(--amber-600)' },
    expired: { label: '✕ Expiré', color: 'var(--red-500)' },
  }
  const { label, color } = map[v.status]
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
      <span style={{ color: 'var(--slate-600)' }}>{v.name}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 700, color }}>{label}</span>
        <div style={{ fontSize: 10, color: 'var(--slate-400)', marginTop: 1 }}>{v.info}</div>
      </div>
    </div>
  )
}

interface Props {
  id: string
  onBack: () => void
}

export default function AnimalDetailPage({ id, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('infos')
  const animal = ANIMALS.find(a => a.id === id)

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

  const { cls: statusCls, label: statusLabel } = STATUS_BADGE[animal.status]
  const hasAlert = animal.status === 'alerte' || !animal.vaccineOk
  const expiredVaccines = animal.vaccines.filter(v => v.status === 'expired' || v.status === 'soon')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'infos',     label: 'Informations' },
    { key: 'seances',   label: 'Séances',   count: animal.sessions * 4 },
    { key: 'sante',     label: 'Santé',     count: expiredVaccines.length || undefined },
    { key: 'documents', label: 'Documents' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{animal.name}</h1>
          <p className="page-subtitle">{animal.species} · {animal.gender} · {animal.id}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          <button className="btn btn-secondary">📋 Protocole</button>
          <button className="btn btn-secondary">📤 Exporter</button>
          <button className="btn btn-primary">✏ Modifier</button>
        </div>
      </div>

      {/* Hero */}
      <div className="detail-hero">
        <div className="hero-avatar">{animal.emoji}</div>
        <div style={{ flex: 1 }}>
          <div className="hero-name">{animal.name}</div>
          <div className="hero-meta">
            {animal.species} · {animal.gender} · né(e) le {animal.birthDate}
          </div>
          <div className="hero-badges">
            <span className={`hero-badge hero-badge-status ${animal.status}`}>
              {statusLabel}
            </span>
            <span className="hero-badge">{animal.id}</span>
            {animal.chipId !== '—' && (
              <span className="hero-badge">Puce {animal.chipId}</span>
            )}
            {hasAlert && (
              <span className="hero-badge hero-badge-alert">⚠ Alerte sanitaire</span>
            )}
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
                <div
                  key={t.key}
                  className={`tab-item${activeTab === t.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className="tab-count">{t.count}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card-body">
            {activeTab === 'infos' && (
              <>
                <div className="info-grid">
                  <div className="info-tile">
                    <div className="info-label">Espèce</div>
                    <div className="info-value">{animal.species}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-label">Sexe</div>
                    <div className="info-value">{animal.gender}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-label">Poids</div>
                    <div className="info-value">{animal.weight}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-label">Dernier contrôle vét.</div>
                    <div className="info-value">{animal.lastVetCheck}</div>
                  </div>
                  <div className={`info-tile${!animal.vaccineOk ? ' info-tile-alert' : ''}`}>
                    <div className="info-label">Vaccinations</div>
                    <div className="info-value" style={{ color: animal.vaccineOk ? 'var(--green-600)' : 'var(--red-500)', fontSize: 13 }}>
                      {animal.vaccineOk ? '✓ À jour' : '✕ Attention requise'}
                    </div>
                    <div className="info-sub">
                      {animal.vaccines.filter(v => v.status !== 'ok').length > 0
                        ? `${animal.vaccines.filter(v => v.status !== 'ok').length} vaccin(s) à renouveler`
                        : 'Tous les vaccins sont valides'}
                    </div>
                  </div>
                  <div className="info-tile">
                    <div className="info-label">Antiparasitaire</div>
                    <div className="info-value" style={{ color: animal.antiparasiteOk ? 'var(--green-600)' : 'var(--amber-600)', fontSize: 13 }}>
                      {animal.antiparasiteOk ? '✓ Actif' : '⚠ Non renseigné'}
                    </div>
                    <div className="info-sub">{animal.antiparasiteInfo}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-label">Vermifuge</div>
                    <div className="info-value" style={{ fontSize: 13 }}>
                      {animal.vermifugeDaysLeft === null
                        ? <span style={{ color: 'var(--slate-400)' }}>—</span>
                        : animal.vermifugeDaysLeft < 30
                        ? <span style={{ color: 'var(--amber-600)' }}>⚠ Dans {animal.vermifugeDaysLeft} jours</span>
                        : <span style={{ color: 'var(--green-600)' }}>✓ Dans {animal.vermifugeDaysLeft} jours</span>
                      }
                    </div>
                  </div>
                  <div className="info-tile">
                    <div className="info-label">Intervenant référent</div>
                    <div className="info-value" style={{ fontSize: 13 }}>
                      {animal.handler === '—' ? <span style={{ color: 'var(--slate-400)' }}>—</span> : animal.handler}
                    </div>
                  </div>
                  <div className="info-tile">
                    <div className="info-label">Séances ce mois</div>
                    <div className="info-value">{animal.sessions}</div>
                    <div className="info-sub">Dernière : {animal.lastSession}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-label">Puce électronique</div>
                    <div className="info-value" style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 5 }}>
                      {animal.chipId}
                    </div>
                  </div>
                </div>

                {animal.establishments.length > 0 && (
                  <div style={{ marginTop: 'var(--sp-5)' }}>
                    <div className="info-label" style={{ marginBottom: 'var(--sp-2)' }}>Établissements autorisés</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                      {animal.establishments.map(e => (
                        <span key={e} className="badge badge-terra">{e}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab !== 'infos' && (
              <div className="empty-state" style={{ padding: 'var(--sp-10) var(--sp-6)' }}>
                <div className="empty-icon">
                  {activeTab === 'seances' ? '📋' : activeTab === 'sante' ? '🩺' : '📄'}
                </div>
                <div className="empty-title">Section en construction</div>
                <div className="empty-text">Cette section sera disponible prochainement.</div>
              </div>
            )}
          </div>
        </div>

        {/* Right — sidebar cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          {/* Next session */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Prochaine séance</div>
            </div>
            <div className="card-body">
              {animal.nextSession ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)' }}>
                    {animal.nextSession.structure}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 3 }}>
                    {animal.nextSession.date}
                  </div>
                  <div style={{ marginTop: 'var(--sp-3)', display: 'flex', gap: 'var(--sp-2)' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Voir</button>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Modifier</button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--sp-3) 0' }}>
                  <div style={{ fontSize: 12, color: 'var(--slate-400)', marginBottom: 'var(--sp-3)' }}>
                    Aucune séance planifiée
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    + Planifier une séance
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Vaccine status */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Statut sanitaire</div>
              {!animal.vaccineOk && (
                <span className="badge badge-alerte" style={{ fontSize: 10 }}>
                  <span className="badge-dot" />Action requise
                </span>
              )}
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {animal.vaccines.map(v => <VaccineRow key={v.name} v={v} />)}
              <div className="tb-dropdown-divider" style={{ margin: '2px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--slate-600)' }}>Antiparasitaire</span>
                <span style={{ fontWeight: 700, color: animal.antiparasiteOk ? 'var(--green-600)' : 'var(--amber-600)' }}>
                  {animal.antiparasiteOk ? '✓ Actif' : '⚠ Non renseigné'}
                </span>
              </div>
              {!animal.vaccineOk && (
                <button className="btn btn-warning btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--sp-1)' }}>
                  Mettre à jour
                </button>
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
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                Mettre en repos
              </button>
              {animal.status !== 'retraite' && (
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', color: 'var(--slate-500)' }}>
                  Mettre à la retraite
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
