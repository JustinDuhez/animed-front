import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const CRUMBS: Record<string, Array<{ label: string; key?: string }>> = {
  dashboard:  [{ label: 'Tableau de bord' }],
  animals:    [{ label: 'Tableau de bord', key: 'dashboard' }, { label: 'Animaux' }],
  sessions:   [{ label: 'Tableau de bord', key: 'dashboard' }, { label: 'Séances' }],
  structures: [{ label: 'Tableau de bord', key: 'dashboard' }, { label: 'Structures' }],
  staff:      [{ label: 'Tableau de bord', key: 'dashboard' }, { label: 'Intervenants' }],
  alerts:     [{ label: 'Tableau de bord', key: 'dashboard' }, { label: 'Alertes' }],
  settings:   [{ label: 'Tableau de bord', key: 'dashboard' }, { label: 'Paramètres' }],
}

interface Props {
  activePage: string
  onNavigate: (key: string) => void
  children: ReactNode
}

export default function AppLayout({ activePage, onNavigate, children }: Props) {
  const crumbs = CRUMBS[activePage] ?? CRUMBS.dashboard

  return (
    <>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="app-main">
        <Topbar crumbs={crumbs} onNavigate={onNavigate} />
        <main className="app-content">{children}</main>
      </div>
    </>
  )
}
