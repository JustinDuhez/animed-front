import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import {
  requestCalendarToken,
  fetchCalendarEvents,
  calendarEventToSession,
  type CalendarEvent,
} from '../../utils/googleCalendar.js'
import { formatDateTime } from '../../utils/format.js'

interface Props {
  onClose: () => void
  onImported: (count: number) => void
}

type Step = 'pick-range' | 'pick-events' | 'importing' | 'done'

function generateId(): string {
  return `gcal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function GoogleCalendarImportModal({ onClose, onImported }: Props) {
  const today = new Date()
  const inTwoMonths = new Date(today)
  inTwoMonths.setMonth(inTwoMonths.getMonth() + 2)

  const [step,       setStep]       = useState<Step>('pick-range')
  const [from,       setFrom]       = useState(toDateInputValue(today))
  const [to,         setTo]         = useState(toDateInputValue(inTwoMonths))
  const [events,     setEvents]     = useState<CalendarEvent[]>([])
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [error,      setError]      = useState<string | null>(null)
  const [fetching,   setFetching]   = useState(false)
  const [importedN,  setImportedN]  = useState(0)

  async function handleFetch() {
    setError(null)
    setFetching(true)
    try {
      const token  = await requestCalendarToken()
      const items  = await fetchCalendarEvents(token, new Date(from), new Date(to + 'T23:59:59'))
      setEvents(items)
      setSelected(new Set(items.map(e => e.id)))
      setStep('pick-events')
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message ?? 'Erreur lors de la récupération des événements.')
      }
    } finally {
      setFetching(false)
    }
  }

  async function handleImport() {
    setStep('importing')
    const toImport = events.filter(e => selected.has(e.id))
    await Promise.all(
      toImport.map(event => {
        const id = generateId()
        const session = { id, ...calendarEventToSession(event) }
        return setDoc(doc(db, 'sessions', id), session)
      })
    )
    setImportedN(toImport.length)
    setStep('done')
    onImported(toImport.length)
  }

  function toggleEvent(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev =>
      prev.size === events.length ? new Set() : new Set(events.map(e => e.id))
    )
  }

  const allSelected  = events.length > 0 && selected.size === events.length
  const someSelected = selected.size > 0 && selected.size < events.length

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--slate-0, #fff)', borderRadius: 16, padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)', width: 'min(560px, 92vw)', maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-900)' }}>
              Importer depuis Google Agenda
            </div>
            <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 2 }}>
              {step === 'pick-range'  && 'Sélectionnez la plage de dates à récupérer'}
              {step === 'pick-events' && `${events.length} événement${events.length !== 1 ? 's' : ''} trouvé${events.length !== 1 ? 's' : ''}`}
              {step === 'importing'   && 'Import en cours…'}
              {step === 'done'        && `${importedN} séance${importedN !== 1 ? 's' : ''} importée${importedN !== 1 ? 's' : ''} avec succès`}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Fermer</button>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ margin: 0 }}>
            <span className="alert-icon">⚠️</span>
            <div className="alert-body"><p className="alert-text">{error}</p></div>
          </div>
        )}

        {/* Step: pick range */}
        {step === 'pick-range' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              <div className="form-field" style={{ margin: 0 }}>
                <label className="form-label">Du</label>
                <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <label className="form-label">Au</label>
                <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
              <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
              <button className="btn btn-primary" onClick={handleFetch} disabled={fetching || !from || !to}>
                {fetching ? 'Récupération…' : 'Récupérer les événements'}
              </button>
            </div>
          </>
        )}

        {/* Step: pick events */}
        {step === 'pick-events' && (
          <>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, padding: 'var(--sp-4) 0' }}>
                Aucun événement trouvé dans cette plage de dates.
              </div>
            ) : (
              <>
                {/* Select all */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 13, fontWeight: 600, color: 'var(--slate-700)', cursor: 'pointer', borderBottom: '1px solid var(--slate-100)', paddingBottom: 'var(--sp-3)' }}>
                  <input
                    type="checkbox"
                    className="table-check"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleAll}
                  />
                  Tout sélectionner ({selected.size} / {events.length})
                </label>

                {/* Event list */}
                <div style={{ overflowY: 'auto', maxHeight: '40vh', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  {events.map(event => {
                    const dateStr = event.start.dateTime ?? event.start.date ?? ''
                    return (
                      <label
                        key={event.id}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)', padding: 'var(--sp-3)', borderRadius: 10, border: '1px solid var(--slate-100)', cursor: 'pointer', background: selected.has(event.id) ? 'var(--green-50, #f0fdf4)' : undefined }}
                      >
                        <input
                          type="checkbox"
                          className="table-check"
                          style={{ marginTop: 2, flexShrink: 0 }}
                          checked={selected.has(event.id)}
                          onChange={() => toggleEvent(event.id)}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-900)' }}>{event.summary ?? '(sans titre)'}</div>
                          <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 2 }}>
                            {dateStr ? formatDateTime(dateStr) : '—'}
                            {event.location && <> · 📍 {event.location}</>}
                          </div>
                          {event.description && (
                            <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {event.description}
                            </div>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)', borderTop: '1px solid var(--slate-100)', paddingTop: 'var(--sp-4)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setStep('pick-range')}>← Modifier la plage</button>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={selected.size === 0}>
                  Importer {selected.size > 0 ? `(${selected.size})` : ''}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step: importing */}
        {step === 'importing' && (
          <div style={{ textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, padding: 'var(--sp-4) 0' }}>
            Import en cours…
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <>
            <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0' }}>
              <div style={{ fontSize: 32, marginBottom: 'var(--sp-2)' }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-900)' }}>
                {importedN} séance{importedN !== 1 ? 's' : ''} importée{importedN !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 4 }}>
                Les séances ont été créées avec le statut "Planifiée". Pensez à assigner les animaux et intervenants.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={onClose}>Fermer</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
