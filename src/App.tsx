import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from './firebase.js'
import AppLayout from './components/layout/AppLayout.js'
import Dashboard from './pages/Dashboard.js'
import AnimalsPage from './pages/AnimalsPage.js'
import AnimalDetailPage from './pages/AnimalDetailPage.js'
import PlaceholderPage from './pages/PlaceholderPage.js'
import LoginPage from './pages/LoginPage.js'

type PageKey = 'dashboard' | 'animals' | 'sessions' | 'structures' | 'staff' | 'alerts' | 'settings'

function App() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [selectedAnimal, setSelectedAnimal] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u))
  }, [])

  if (user === undefined) return null
  if (!user) return <LoginPage />

  function navigate(k: string) {
    setPage(k as PageKey)
    setSelectedAnimal(null)
  }

  return (
    <AppLayout
      activePage={page}
      onNavigate={navigate}
      user={user}
      onSignOut={() => signOut(auth)}
      extraCrumb={page === 'animals' && selectedAnimal ? selectedAnimal.name : undefined}
    >
      {page === 'dashboard'  && <Dashboard onSelectAnimal={(id, name) => { setPage('animals'); setSelectedAnimal({ id, name }) }} />}
      {page === 'animals'    && !selectedAnimal && (
        <AnimalsPage onSelectAnimal={(id, name) => setSelectedAnimal({ id, name })} />
      )}
      {page === 'animals'    && selectedAnimal && (
        <AnimalDetailPage id={selectedAnimal.id} onBack={() => setSelectedAnimal(null)} />
      )}
      {page === 'sessions'   && <PlaceholderPage icon="📋" title="Séances"       description="284 séances ce trimestre"            cta="Planifier une séance" />}
      {page === 'structures' && <PlaceholderPage icon="🏥" title="Structures"    description="31 établissements partenaires"       cta="Ajouter une structure" />}
      {page === 'staff'      && <PlaceholderPage icon="🥼" title="Intervenants"  description="18 intervenants actifs · Tous ACACED" cta="Ajouter un intervenant" />}
      {page === 'alerts'     && <PlaceholderPage icon="⚠️" title="Alertes"       description="5 alertes sanitaires actives" />}
      {page === 'settings'   && <PlaceholderPage icon="⚙️" title="Paramètres"    description="Configuration du back office" />}
    </AppLayout>
  )
}

export default App
