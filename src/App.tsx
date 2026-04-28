import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import PlaceholderPage from './pages/PlaceholderPage'

type PageKey = 'dashboard' | 'animals' | 'sessions' | 'structures' | 'staff' | 'alerts' | 'settings'

function App() {
  const [page, setPage] = useState<PageKey>('dashboard')

  return (
    <AppLayout activePage={page} onNavigate={(k) => setPage(k as PageKey)}>
      {page === 'dashboard'  && <Dashboard />}
      {page === 'animals'    && <PlaceholderPage icon="🐾" title="Animaux"       description="47 animaux enregistrés · 5 alertes"  cta="Ajouter un animal" />}
      {page === 'sessions'   && <PlaceholderPage icon="📋" title="Séances"       description="284 séances ce trimestre"            cta="Planifier une séance" />}
      {page === 'structures' && <PlaceholderPage icon="🏥" title="Structures"    description="31 établissements partenaires"       cta="Ajouter une structure" />}
      {page === 'staff'      && <PlaceholderPage icon="🥼" title="Intervenants"  description="18 intervenants actifs · Tous ACACED" cta="Ajouter un intervenant" />}
      {page === 'alerts'     && <PlaceholderPage icon="⚠️" title="Alertes"       description="5 alertes sanitaires actives" />}
      {page === 'settings'   && <PlaceholderPage icon="⚙️" title="Paramètres"    description="Configuration du back office" />}
    </AppLayout>
  )
}

export default App
