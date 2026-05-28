import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from './firebase.js'
import AppLayout from './components/layout/AppLayout.js'
import Dashboard from './pages/Dashboard.js'
import AnimalsPage from './pages/AnimalsPage.js'
import AnimalDetailPage from './pages/AnimalDetailPage.js'
import AddAnimalPage from './pages/AddAnimalPage.js'
import SessionsPage from './pages/SessionsPage.js'
import AddSessionPage from './pages/AddSessionPage.js'
import SessionDetailPage from './pages/SessionDetailPage.js'
import PlaceholderPage from './pages/PlaceholderPage.js'
import LoginPage from './pages/LoginPage.js'

type PageKey = 'dashboard' | 'animals' | 'sessions' | 'structures' | 'staff' | 'alerts' | 'settings'

function App() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [selectedAnimal, setSelectedAnimal] = useState<{ id: string; name: string } | null>(null)
  const [addingAnimal, setAddingAnimal] = useState(false)
  const [addingSession, setAddingSession] = useState(false)
  const [selectedSession, setSelectedSession] = useState<{ id: string; label: string } | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u))
  }, [])

  if (user === undefined) return null
  if (!user) return <LoginPage />

  function navigate(k: string) {
    setPage(k as PageKey)
    setSelectedAnimal(null)
    setAddingAnimal(false)
    setAddingSession(false)
    setSelectedSession(null)
  }

  const extraCrumb =
    page === 'animals'
      ? addingAnimal ? 'Nouvel animal' : selectedAnimal ? selectedAnimal.name : undefined
    : page === 'sessions'
      ? addingSession ? 'Nouvelle séance' : selectedSession ? selectedSession.label : undefined
    : undefined

  return (
    <AppLayout
      activePage={page}
      onNavigate={navigate}
      user={user}
      onSignOut={() => signOut(auth)}
      extraCrumb={extraCrumb}
    >
      {page === 'dashboard'  && <Dashboard onSelectAnimal={(id, name) => { setPage('animals'); setSelectedAnimal({ id, name }) }} />}
      {page === 'animals' && !selectedAnimal && !addingAnimal && (
        <AnimalsPage
          onSelectAnimal={(id, name) => setSelectedAnimal({ id, name })}
          onAddAnimal={() => setAddingAnimal(true)}
        />
      )}
      {page === 'animals' && addingAnimal && (
        <AddAnimalPage
          onBack={() => setAddingAnimal(false)}
          onSaved={(id, name) => { setAddingAnimal(false); setSelectedAnimal({ id, name }) }}
        />
      )}
      {page === 'animals' && selectedAnimal && !addingAnimal && (
        <AnimalDetailPage id={selectedAnimal.id} onBack={() => setSelectedAnimal(null)} />
      )}
      {page === 'sessions' && !addingSession && !selectedSession && (
        <SessionsPage
          onSelectAnimal={(id, name) => { setPage('animals'); setSelectedAnimal({ id, name }) }}
          onAddSession={() => setAddingSession(true)}
          onSelectSession={(id, label) => setSelectedSession({ id, label })}
        />
      )}
      {page === 'sessions' && addingSession && (
        <AddSessionPage
          onBack={() => setAddingSession(false)}
          onSaved={() => setAddingSession(false)}
        />
      )}
      {page === 'sessions' && selectedSession && !addingSession && (
        <SessionDetailPage
          id={selectedSession.id}
          onBack={() => setSelectedSession(null)}
          onSelectAnimal={(id, name) => { setPage('animals'); setSelectedAnimal({ id, name }) }}
        />
      )}
      {page === 'structures' && <PlaceholderPage icon="🏥" title="Structures"    description="31 établissements partenaires"       cta="Ajouter une structure" />}
      {page === 'staff'      && <PlaceholderPage icon="🥼" title="Intervenants"  description="18 intervenants actifs · Tous ACACED" cta="Ajouter un intervenant" />}
      {page === 'alerts'     && <PlaceholderPage icon="⚠️" title="Alertes"       description="5 alertes sanitaires actives" />}
      {page === 'settings'   && <PlaceholderPage icon="⚙️" title="Paramètres"    description="Configuration du back office" />}
    </AppLayout>
  )
}

export default App
