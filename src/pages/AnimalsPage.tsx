import { useState, useMemo, useEffect, useRef } from 'react'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal } from '../data/animal.js'
import { ANIMAL_STATUS_MAP, requiresVaccineAlert } from '../utils/badges.js'
import { useRole } from '../context/RoleContext.js'
import { formatShortDate } from '../utils/format.js'
import PageHeader from '../components/ui/PageHeader.js'
import AlertBanner from '../components/ui/AlertBanner.js'
import SearchBar from '../components/ui/SearchBar.js'
import FilterBar from '../components/ui/FilterBar.js'
import EmptyState from '../components/ui/EmptyState.js'

type FilterTab = 'tous' | 'actif' | 'repos' | 'alerte'
type SortKey   = 'name' | 'species' | 'sessions' | 'handler'
type SortDir   = 'asc' | 'desc'

const PAGE_SIZE = 10

const FILTER_LABELS: Record<FilterTab, string> = {
  tous:   'Tous',
  actif:  'Actifs',
  repos:  'Repos',
  alerte: '⚠ Alertes',
}

function sortIcon(key: SortKey, sortKey: SortKey | null, sortDir: SortDir) {
  return (
    <span className="sort-icon">
      <span className="up"   style={sortKey === key && sortDir === 'asc'  ? { borderBottomColor: 'var(--green-500)' } : undefined} />
      <span className="down" style={sortKey === key && sortDir === 'desc' ? { borderTopColor:    'var(--green-500)' } : undefined} />
    </span>
  )
}

const PEN_OVERDUE_MS = 15 * 24 * 60 * 60 * 1000

function isPenOverdue(a: Animal) {
  return !!a.penMaintenance && (Date.now() - new Date(a.penMaintenance).getTime()) > PEN_OVERDUE_MS
}

function thClass(key: SortKey, sortKey: SortKey | null, sortDir: SortDir) {
  if (sortKey !== key) return 'sortable'
  return `sortable ${sortDir === 'asc' ? 'sort-asc' : 'sort-desc'}`
}

interface Props {
  onSelectAnimal:  (id: string, name: string) => void
  onAddAnimal:     () => void
  initialFilter?:  FilterTab
}

export default function AnimalsPage({ onSelectAnimal, onAddAnimal, initialFilter }: Props) {
  const canWrite = useRole() !== 'viewer'
  const [animals,  setAnimals]  = useState<Animal[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState<FilterTab>(initialFilter ?? 'tous')
  const [page,     setPage]     = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortKey,    setSortKey]    = useState<SortKey | null>('name')
  const [sortDir,    setSortDir]    = useState<SortDir>('asc')
  const [showQrGrid, setShowQrGrid] = useState(false)

  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
const unsub = onSnapshot(collection(db, 'animals'), snap => {
      setAnimals(snap.docs.map(d => d.data() as Animal))
      setLoading(false)
    })
    return unsub
  }, [])

  const counts = useMemo(() => ({
    tous:   animals.length,
    actif:  animals.filter((a: Animal) => a.status === 'actif').length,
    repos:  animals.filter((a: Animal) => a.status === 'repos').length,
    alerte: animals.filter((a: Animal) => a.status === 'alerte' || (!a.vaccineOk && requiresVaccineAlert(a.emoji)) || isPenOverdue(a)).length,
  }), [animals])

  const processed = useMemo(() => {
    let data = animals

    if (filter === 'actif')  data = data.filter(a => a.status === 'actif')
    if (filter === 'repos')  data = data.filter(a => a.status === 'repos')
    if (filter === 'alerte') data = data.filter(a => a.status === 'alerte' || (!a.vaccineOk && requiresVaccineAlert(a.emoji)) || isPenOverdue(a))

    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(a =>
        a.name.toLowerCase().includes(q)    ||
        a.id.toLowerCase().includes(q)      ||
        a.species.toLowerCase().includes(q) ||
        a.handler.toLowerCase().includes(q)
      )
    }

    if (sortKey) {
      const currentMonth = new Date().toISOString().slice(0, 7)
      data = [...data].sort((a, b) => {
        const av = sortKey === 'sessions' ? (a.sessions[currentMonth] ?? 0) : a[sortKey]
        const bv = sortKey === 'sessions' ? (b.sessions[currentMonth] ?? 0) : b[sortKey]
        const cmp = typeof av === 'number'
          ? (av as number) - (bv as number)
          : String(av).localeCompare(String(bv), 'fr')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return data
  }, [animals, search, filter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const start      = (safePage - 1) * PAGE_SIZE
  const paginated  = processed.slice(start, start + PAGE_SIZE)

  const allPageSelected  = paginated.length > 0 && paginated.every(a => selected.has(a.id))
  const somePageSelected = paginated.some(a => selected.has(a.id))

  useEffect(() => {
    if (selectAllRef.current)
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected
  }, [somePageSelected, allPageSelected])

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allPageSelected) paginated.forEach(a => next.delete(a.id))
      else paginated.forEach(a => next.add(a.id))
      return next
    })
  }

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  function handleFilter(f: FilterTab) {
    setFilter(f)
    setPage(1)
    setSelected(new Set())
  }

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  if (loading) return <EmptyState icon="🐾" title="Chargement…" />

  const filterChips = (['tous', 'actif', 'repos', 'alerte'] as FilterTab[]).map(f => ({
    key: f, label: FILTER_LABELS[f], count: counts[f],
  }))

  return (
    <>
      <PageHeader
        title="Animaux"
        subtitle={`${animals.length} animaux enregistrés · ${counts.alerte} alertes sanitaires`}
      >
        {canWrite && <button className="btn btn-primary" onClick={onAddAnimal}>+ Ajouter un animal</button>}
      </PageHeader>

      {counts.alerte > 0 && filter !== 'alerte' && (
        <AlertBanner
          icon="⚠"
          title={`${counts.alerte} animaux nécessitent votre attention`}
          description="Vaccinations expirées ou statut critique. Vérifiez avant les prochaines séances."
          action={
            <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={() => handleFilter('alerte')}>
              Voir les alertes
            </button>
          }
        />
      )}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <SearchBar
            placeholder="Nom, ID, espèce, intervenant…"
            value={search}
            onChange={handleSearch}
          />
          <FilterBar chips={filterChips} active={filter} onChange={f => handleFilter(f as FilterTab)} />
          <button className="btn btn-secondary btn-sm" onClick={() => setShowQrGrid(true)}>QR Codes</button>
          <button className="btn btn-secondary btn-sm">⬇ Exporter</button>
        </div>

        <table>
          <thead>
            <tr>
              <th className="col-check">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="table-check"
                  checked={allPageSelected}
                  onChange={toggleAll}
                />
              </th>
              <th className={thClass('name',    sortKey, sortDir)} onClick={() => handleSort('name')}>
                Animal {sortIcon('name', sortKey, sortDir)}
              </th>
              <th className={thClass('species', sortKey, sortDir)} onClick={() => handleSort('species')}>
                Espèce {sortIcon('species', sortKey, sortDir)}
              </th>
              <th>Statut</th>
              <th>Vaccin</th>
              <th className={thClass('sessions', sortKey, sortDir)} onClick={() => handleSort('sessions')}>
                Séances / mois {sortIcon('sessions', sortKey, sortDir)}
              </th>
              <th>Dernière séance</th>
              <th>Entretien box</th>
              <th className={thClass('handler', sortKey, sortDir)} onClick={() => handleSort('handler')}>
                Intervenant {sortIcon('handler', sortKey, sortDir)}
              </th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState
                    icon="🐾"
                    title="Aucun animal trouvé"
                    description={search
                      ? `Aucun résultat pour « ${search} ». Essayez un autre terme.`
                      : 'Aucun animal dans cette catégorie.'}
                    action={search
                      ? <button className="btn btn-secondary" onClick={() => handleSearch('')}>Réinitialiser la recherche</button>
                      : undefined}
                  />
                </td>
              </tr>
            ) : paginated.map(a => (
              <tr
                key={a.id}
                className={selected.has(a.id) ? 'selected' : ''}
                onClick={() => toggleRow(a.id)}
              >
                <td onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="table-check"
                    checked={selected.has(a.id)}
                    onChange={() => toggleRow(a.id)}
                  />
                </td>
                <td className="td-primary">
                  <div
                    className="td-cell-animal"
                    style={{ cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); onSelectAnimal(a.id, a.name) }}
                  >
                    <div className="td-av">{a.emoji}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                      <div className="td-mono">{a.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--slate-600)' }}>{a.species}</td>
                <td>
                  <span className={`badge ${(ANIMAL_STATUS_MAP[a.status] ?? ANIMAL_STATUS_MAP.alerte).cls}`}>
                    <span className="badge-dot" />
                    {(ANIMAL_STATUS_MAP[a.status] ?? ANIMAL_STATUS_MAP.alerte).label}
                  </span>
                </td>
                <td>
                  <span className={`badge ${a.vaccineOk ? 'badge-actif' : requiresVaccineAlert(a.emoji) ? 'badge-alerte' : 'badge-repos'}`}>
                    <span className="badge-dot" />
                    {a.vaccineOk ? 'À jour' : requiresVaccineAlert(a.emoji) ? 'Expiré' : 'N/A'}
                  </span>
                </td>
                <td>{a.sessions[new Date().toISOString().slice(0, 7)] ?? 0}</td>
                <td style={{ color: a.lastSession === '—' ? 'var(--slate-300)' : 'var(--slate-500)' }}>
                  {formatShortDate(a.lastSession)}
                </td>
                <td>
                  {a.penMaintenance ? (() => {
                    const overdue = (Date.now() - new Date(a.penMaintenance).getTime()) > 15 * 24 * 60 * 60 * 1000
                    return (
                      <span style={{ color: overdue ? 'var(--red-500)' : 'var(--green-600)', fontSize: 12, fontWeight: 600 }}>
                        {overdue ? '⚠ ' : '✓ '}{formatShortDate(a.penMaintenance)}
                      </span>
                    )
                  })() : <span style={{ color: 'var(--slate-300)' }}>—</span>}
                </td>
                <td style={{ color: a.handler === '—' ? 'var(--slate-300)' : 'var(--slate-600)' }}>
                  {a.handler}
                </td>
                <td className="td-actions" onClick={e => e.stopPropagation()}>
                  <button className="td-action-btn" title="Modifier">✏</button>
                  <button className="td-action-btn" title="Voir la fiche" onClick={() => onSelectAnimal(a.id, a.name)}>🔗</button>
                  <button
                    className="td-action-btn danger"
                    title="Supprimer"
                    onClick={() => {
                      if (window.confirm(`Supprimer ${a.name} ? Cette action est irréversible.`))
                        deleteDoc(doc(db, 'animals', a.id)).catch(console.error)
                    }}
                  >🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-pagination">
          <span className="pag-info">
            {processed.length === 0
              ? 'Aucun résultat'
              : <>
                  Affichage {start + 1}–{Math.min(start + PAGE_SIZE, processed.length)} sur {processed.length} animaux
                  {selected.size > 0 && <> · <strong>{selected.size}</strong> sélectionné{selected.size > 1 ? 's' : ''}</>}
                </>
            }
          </span>
          <div className="pag-controls">
            <button className="pag-btn" disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
            <button className="pag-btn" disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {pageNumbers.map(p => (
              <button key={p} className={`pag-btn${p === safePage ? ' active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="pag-btn" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            <button className="pag-btn" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      </div>

      {showQrGrid && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowQrGrid(false)}
        >
          <div
            style={{ background: 'var(--slate-0, #fff)', borderRadius: 16, padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', width: 'min(900px, 90vw)', maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-6)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-900)' }}>QR Codes — {animals.length} animaux</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowQrGrid(false)}>Fermer</button>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '65vh' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--sp-4)' }}>
              {animals.map(a => (
                <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', border: '1px solid var(--slate-100)', borderRadius: 12 }}>
                  {a.qrCode
                    ? <img src={a.qrCode} alt={`QR ${a.name}`} style={{ width: 120, height: 120 }} />
                    : <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-300)', fontSize: 11 }}>En cours…</div>
                  }
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)', textAlign: 'center' }}>{a.emoji} {a.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--slate-400)', fontFamily: 'monospace' }}>{a.id}</div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
