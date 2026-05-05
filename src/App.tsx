import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import PlaceholderPage from './pages/PlaceholderPage'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';

type PageKey = 'dashboard' | 'animals' | 'sessions' | 'structures' | 'staff' | 'alerts' | 'settings'

const firebaseConfig = {
  apiKey: "AIzaSyDH4prce6XF35j0QzmI0pPjLtmVO67zkF4",
  authDomain: "animed-57012.firebaseapp.com",
  projectId: "animed-57012",
  storageBucket: "animed-57012.firebasestorage.app",
  messagingSenderId: "471514822873",
  appId: "1:471514822873:web:0c6ca38dac02d0507de6c8",
  measurementId: "G-GJ7GNPZJNP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

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
