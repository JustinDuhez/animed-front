import { useState, useEffect, useRef } from 'react'
import type { Animal } from '../../data/animal.js'
import { exportAnimalsPdf } from '../../utils/animalPdf.js'
import { ANIMAL_STATUS_MAP } from '../../utils/badges.js'

interface Props {
  animals: Animal[]
  onClose: () => void
}

export default function AnimalExportModal({ animals, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(animals.map(a => a.id)))
  const [search,   setSearch]   = useState('')
  const selectAllRef = useRef<HTMLInputElement>(null)

  const filtered = search.trim()
    ? animals.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.species.toLowerCase().includes(search.toLowerCase()),
      )
    : animals

  const allSelected  = filtered.length > 0 && filtered.every(a => selected.has(a.id))
  const someSelected = filtered.some(a => selected.has(a.id))

  useEffect(() => {
    if (selectAllRef.current)
      selectAllRef.current.indeterminate = someSelected && !allSelected
  }, [someSelected, allSelected])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) filtered.forEach(a => next.delete(a.id))
      else filtered.forEach(a => next.add(a.id))
      return next
    })
  }

  function handleExport() {
    const toExport = animals.filter(a => selected.has(a.id))
    if (toExport.length === 0) return
    exportAnimalsPdf(toExport)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--slate-0, #fff)', borderRadius: 16, padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', width: 'min(540px, 92vw)', maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--slate-900)' }}>Exporter en PDF</div>
            <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 2 }}>
              {selected.size} animal{selected.size !== 1 ? 'x' : ''} sélectionné{selected.size !== 1 ? 's' : ''}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <input
          className="form-input"
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Select all */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 12, fontWeight: 600, color: 'var(--slate-600)', cursor: 'pointer', userSelect: 'none' }}>
          <input ref={selectAllRef} type="checkbox" className="table-check" checked={allSelected} onChange={toggleAll} />
          Tout sélectionner ({filtered.length})
        </label>

        <div className="tb-dropdown-divider" style={{ margin: 0 }} />

        {/* Animal list */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', maxHeight: '40vh' }}>
          {filtered.map(a => {
            const { cls, label } = ANIMAL_STATUS_MAP[a.status] ?? ANIMAL_STATUS_MAP.alerte
            return (
              <label
                key={a.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                  padding: 'var(--sp-2) var(--sp-3)', borderRadius: 8, cursor: 'pointer',
                  background: selected.has(a.id) ? 'var(--green-50)' : 'var(--slate-50)',
                  border: `1px solid ${selected.has(a.id) ? 'var(--green-200)' : 'var(--slate-200)'}`,
                  userSelect: 'none',
                }}
              >
                <input type="checkbox" className="table-check" checked={selected.has(a.id)} onChange={() => toggle(a.id)} />
                <span style={{ fontSize: 22, lineHeight: 1 }}>{a.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{a.species}</div>
                </div>
                <span className={`badge ${cls}`}><span className="badge-dot" />{label}</span>
              </label>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--slate-400)', padding: 'var(--sp-4)' }}>
              Aucun animal trouvé
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end', paddingTop: 'var(--sp-2)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleExport} disabled={selected.size === 0}>
            ⬇ Exporter ({selected.size})
          </button>
        </div>
      </div>
    </div>
  )
}
