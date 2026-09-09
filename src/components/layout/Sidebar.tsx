import { useState, useRef, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase.js'
import type { User } from 'firebase/auth'
import type { Animal } from '../../data/animal.js'
import { useRole } from '../../context/RoleContext.js'
import { ROLE_LABELS, requiresVaccineAlert } from '../../utils/badges.js'
import { isOverdue } from '../../utils/format.js'

interface NavItem {
  icon: string
  label: string
  key: string
  badge?: number
  count?: number
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV: NavSection[] = [
  {
    label: 'Gestion',
    items: [
      { icon: '🏠', label: 'Tableau de bord', key: 'dashboard' },
      { icon: '🐾', label: 'Animaux',          key: 'animals' },
      { icon: '📋', label: 'Séances',          key: 'sessions' },
      { icon: '🏥', label: 'Structures',       key: 'structures' },
      { icon: '🥼', label: 'Intervenants',     key: 'staff' },
    ],
  },
  {
    label: 'Administrateur',
    items: [],
  },
]

const ADMIN_NAV_ITEM: NavItem = { icon: '👥', label: 'Utilisateurs', key: 'users' }

function initials(user: User): string {
  if (user.displayName) {
    return user.displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('')
  }
  return user.email?.[0]?.toUpperCase() ?? '?'
}

function shortName(user: User): string {
  if (user.displayName) return user.displayName
  return user.email ?? ''
}

interface Props {
  activePage: string
  onNavigate: (key: string) => void
  user: User
  onSignOut: () => void
}

export default function Sidebar({ activePage, onNavigate, user, onSignOut }: Props) {
  const role = useRole()
  const [open, setOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const footerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return onSnapshot(collection(db, 'animals'), snap => {
      const count = snap.docs.filter(d => {
        const a = d.data() as Animal
        return a.status === 'alerte' || (!a.vaccineOk && requiresVaccineAlert(a.emoji)) || isOverdue(a.penMaintenance, 15)
      }).length
      setAlertCount(count)
    })
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <aside className="app-sidebar">
      <div className="sb-brand">
        <div className="sb-logo">🐾</div>
        <div>
          <div className="sb-title">AniMed</div>
          <div className="sb-sub">Back Office</div>
        </div>
      </div>

      <nav className="sb-nav">
        {NAV.map((section) => {
          const items = [...section.items, ...(role === 'admin' && section.label === 'Administrateur' ? [ADMIN_NAV_ITEM] : [])]
          if (items.length === 0) return null
          return (
          <div key={section.label} className="sb-section">
            <div className="sb-section-label">{section.label}</div>
            {items.map((item) => (
              <button
                key={item.key}
                className={`sb-link${activePage === item.key ? ' active' : ''}`}
                onClick={() => onNavigate(item.key)}
              >
                <span className="sb-icon">{item.icon}</span>
                {item.label}
                {item.key === 'animals' && alertCount > 0 && (
                  <span className="sb-badge">{alertCount}</span>
                )}
                {item.badge !== undefined && (
                  <span className="sb-badge">{item.badge}</span>
                )}
                {item.count !== undefined && (
                  <span className="sb-count">{item.count}</span>
                )}
              </button>
            ))}
          </div>
          )
        })}
      </nav>

      <div className="sb-footer" ref={footerRef}>
        {open && (
          <div className="sb-user-menu">
            <button
              className="sb-user-menu-item"
              onClick={() => { setOpen(false); onNavigate('profile') }}
            >
              <span>👤</span>
              Mon profil
            </button>
            <button
              className="sb-user-menu-item"
              onClick={() => { setOpen(false); onSignOut() }}
            >
              <span>⎋</span>
              Se déconnecter
            </button>
          </div>
        )}
        <div
          className={`sb-user${open ? ' active' : ''}`}
          onClick={() => setOpen(v => !v)}
          role="button"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <div className="sb-avatar">{initials(user)}</div>
          <div>
            <div className="sb-user-name">{shortName(user)}</div>
            <div className="sb-user-role">{role ? ROLE_LABELS[role] : '…'}</div>
          </div>
          <span className="sb-user-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>
    </aside>
  )
}
