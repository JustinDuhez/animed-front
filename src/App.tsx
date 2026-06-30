import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from './firebase.js'
import { RoleProvider } from './context/RoleContext.js'
import AppLayout from './components/layout/AppLayout.js'
import Dashboard from './pages/Dashboard.js'
import AnimalsPage from './pages/AnimalsPage.js'
import AnimalDetailPage from './pages/AnimalDetailPage.js'
import AddAnimalPage from './pages/AddAnimalPage.js'
import SessionsPage from './pages/SessionsPage.js'
import AddSessionPage from './pages/AddSessionPage.js'
import SessionDetailPage from './pages/SessionDetailPage.js'
import OrganizationsPage from './pages/OrganizationsPage.js'
import AddOrganizationPage from './pages/AddOrganizationPage.js'
import OrganizationDetailPage from './pages/OrganizationDetailPage.js'
import StaffPage from './pages/StaffPage.js'
import AddStaffPage from './pages/AddStaffPage.js'
import StaffDetailPage from './pages/StaffDetailPage.js'
import PlaceholderPage from './pages/PlaceholderPage.js'
import UsersPage from './pages/UsersPage.js'
import LoginPage from './pages/LoginPage.js'

type PageKey = 'dashboard' | 'animals' | 'sessions' | 'structures' | 'users' | 'staff' | 'alerts' | 'settings'

function App() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [selectedAnimal, setSelectedAnimal] = useState<{ id: string; name: string } | null>(null)
  const [addingAnimal, setAddingAnimal] = useState(false)
  const [addingSession, setAddingSession] = useState(false)
  const [selectedSession, setSelectedSession] = useState<{ id: string; label: string } | null>(null)
  const [addingOrganization,    setAddingOrganization]    = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<{ id: string; name: string } | null>(null)
  const [addingStaff,          setAddingStaff]           = useState(false)
  const [selectedStaff,        setSelectedStaff]         = useState<{ id: string; name: string } | null>(null)
  const [animalsInitialFilter, setAnimalsInitialFilter]  = useState<'alerte' | undefined>(undefined)
  const [sessionPreselectedAnimalId, setSessionPreselectedAnimalId] = useState<string | null>(null)

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
    setAddingOrganization(false)
    setSelectedOrganization(null)
    setAddingStaff(false)
    setSelectedStaff(null)
    setAnimalsInitialFilter(undefined)
    setSessionPreselectedAnimalId(null)
  }

  const extraCrumb =
    page === 'animals'
      ? addingAnimal ? 'Nouvel animal' : selectedAnimal ? selectedAnimal.name : undefined
    : page === 'sessions'
      ? addingSession ? 'Nouvelle séance' : selectedSession ? selectedSession.label : undefined
    : page === 'structures'
      ? addingOrganization ? 'Nouvelle structure' : selectedOrganization ? selectedOrganization.name : undefined
    : page === 'staff'
      ? addingStaff ? 'Nouvel intervenant' : selectedStaff ? selectedStaff.name : undefined
    : undefined

  return (
    <RoleProvider>
    <AppLayout
      activePage={page}
      onNavigate={navigate}
      user={user}
      onSignOut={() => signOut(auth)}
      extraCrumb={extraCrumb}
    >
      {page === 'dashboard' && (
        <Dashboard
          onSelectAnimal={(id, name) => { setPage('animals'); setSelectedAnimal({ id, name }) }}
          onAddSession={() => { setPage('sessions'); setAddingSession(true) }}
          onSelectSession={(id, label) => { setPage('sessions'); setSelectedSession({ id, label }) }}
          onViewAlerts={() => { setAnimalsInitialFilter('alerte'); setPage('animals') }}
        />
      )}
      {page === 'animals' && !selectedAnimal && !addingAnimal && (
        <AnimalsPage
          onSelectAnimal={(id, name) => setSelectedAnimal({ id, name })}
          onAddAnimal={() => setAddingAnimal(true)}
          initialFilter={animalsInitialFilter}
        />
      )}
      {page === 'animals' && addingAnimal && (
        <AddAnimalPage
          onBack={() => setAddingAnimal(false)}
          onSaved={(id, name) => { setAddingAnimal(false); setSelectedAnimal({ id, name }) }}
        />
      )}
      {page === 'animals' && selectedAnimal && !addingAnimal && (
        <AnimalDetailPage
          id={selectedAnimal.id}
          onBack={() => setSelectedAnimal(null)}
          onSelectSession={(id, label) => { setPage('sessions'); setSelectedSession({ id, label }) }}
          onAddSession={() => { setSessionPreselectedAnimalId(selectedAnimal.id); setPage('sessions'); setAddingSession(true) }}
          onSelectStaff={(id, name) => { setPage('staff'); setSelectedStaff({ id, name }) }}
        />
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
          onBack={() => { setAddingSession(false); setSessionPreselectedAnimalId(null) }}
          onSaved={() => { setAddingSession(false); setSessionPreselectedAnimalId(null) }}
          preselectedAnimalId={sessionPreselectedAnimalId ?? undefined}
        />
      )}
      {page === 'sessions' && selectedSession && !addingSession && (
        <SessionDetailPage
          id={selectedSession.id}
          onBack={() => setSelectedSession(null)}
          onSelectAnimal={(id, name) => { setPage('animals'); setSelectedAnimal({ id, name }) }}
        />
      )}
      {page === 'structures' && !addingOrganization && !selectedOrganization && (
        <OrganizationsPage
          onAddOrganization={() => setAddingOrganization(true)}
          onSelectOrganization={(id, name) => setSelectedOrganization({ id, name })}
        />
      )}
      {page === 'structures' && addingOrganization && (
        <AddOrganizationPage
          onBack={() => setAddingOrganization(false)}
          onSaved={() => setAddingOrganization(false)}
        />
      )}
      {page === 'structures' && selectedOrganization && !addingOrganization && (
        <OrganizationDetailPage
          id={selectedOrganization.id}
          onBack={() => setSelectedOrganization(null)}
          onSelectSession={(id, label) => { setPage('sessions'); setSelectedSession({ id, label }) }}
        />
      )}
      {page === 'users' && <UsersPage />}
      {page === 'staff' && !addingStaff && !selectedStaff && (
        <StaffPage
          onAddStaff={() => setAddingStaff(true)}
          onSelectStaff={(id, name) => setSelectedStaff({ id, name })}
        />
      )}
      {page === 'staff' && addingStaff && (
        <AddStaffPage
          onBack={() => setAddingStaff(false)}
          onSaved={(id, name) => { setAddingStaff(false); setSelectedStaff({ id, name }) }}
        />
      )}
      {page === 'staff' && selectedStaff && !addingStaff && (
        <StaffDetailPage
          id={selectedStaff.id}
          onBack={() => setSelectedStaff(null)}
          onSelectSession={(id, label) => { setPage('sessions'); setSelectedSession({ id, label }) }}
        />
      )}
      {page === 'alerts'     && <PlaceholderPage icon="⚠️" title="Alertes"       description="5 alertes sanitaires actives" />}
      {page === 'settings'   && <PlaceholderPage icon="⚙️" title="Paramètres"    description="Configuration du back office" />}
    </AppLayout>
    </RoleProvider>
  )
}

export default App
