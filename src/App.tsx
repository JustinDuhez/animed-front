import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from './firebase.js'
import AppLayout from './components/layout/AppLayout.js'
import Dashboard from './pages/Dashboard.js'
import PlaceholderPage from './pages/PlaceholderPage.js'
import LoginPage from './pages/LoginPage.js'

type PageKey = 'dashboard' | 'animals' | 'sessions' | 'structures' | 'staff' | 'alerts' | 'settings'

function App() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u))
  }, [])

  if (user === undefined) return null
  if (!user) return <LoginPage />

  return (
    <AppLayout
      activePage={page}
      onNavigate={(k) => setPage(k as PageKey)}
      user={user}
      onSignOut={() => signOut(auth)}
    >
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
