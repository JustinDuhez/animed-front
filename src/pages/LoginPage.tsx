import { useState, FormEvent } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Identifiants incorrects. Vérifiez votre adresse e-mail et votre mot de passe.'
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà associée à un compte.'
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives échouées. Réessayez dans quelques minutes.'
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé. Contactez votre administrateur.'
    default:
      return 'Une erreur est survenue. Veuillez réessayer.'
  }
}

type Mode = 'login' | 'register'

export default function LoginPage() {
  const [mode, setMode]             = useState<Mode>('login')
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setPassword('')
    setConfirm('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'register' && password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        const trimmedName = name.trim()
        if (trimmedName) {
          await updateProfile(credential.user, { displayName: trimmedName })
        }
        // Write the Firestore document after updateProfile so displayName is correct.
        // RoleContext may have already created it with an empty displayName (race condition),
        // so we overwrite it here with the definitive values.
        await setDoc(doc(db, 'users', credential.user.uid), {
          email:       email,
          displayName: trimmedName,
          role:        'viewer',
          createdAt:   new Date().toISOString(),
        })
      }
    } catch (err: any) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getErrorMessage(err.code))
      }
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand-logo">🐾</div>
        <h1 className="login-brand-title">AniMed</h1>
        <p className="login-brand-sub">Back Office</p>
        <p className="login-brand-desc">
          Plateforme de gestion des thérapies facilitées par l'animal
        </p>
        <ul className="login-brand-features">
          <li>Suivi des animaux &amp; séances</li>
          <li>Gestion des intervenants</li>
          <li>Alertes sanitaires en temps réel</li>
        </ul>
      </div>

      <div className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-logo-mobile">
            <div className="sb-logo">🐾</div>
          </div>

          <h2 className="login-title">
            {isRegister ? 'Créer un compte' : 'Connexion'}
          </h2>
          <p className="login-subtitle">
            {isRegister
              ? "Créez votre accès à l'espace de gestion AniMed"
              : 'Accédez à votre espace de gestion AniMed'}
          </p>

          {error && (
            <div className="alert alert-error login-alert">
              <span className="alert-icon">⚠️</span>
              <div className="alert-body">
                <p className="alert-text">{error}</p>
              </div>
            </div>
          )}

          {isRegister && (
            <div className="form-field">
              <label className="form-label" htmlFor="name">Nom complet</label>
              <input
                id="name"
                className="form-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Marie Dupont"
                autoComplete="name"
                autoFocus
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              className={`form-input${error ? ' error' : ''}`}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@example.com"
              required
              autoComplete="email"
              autoFocus={!isRegister}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              className={`form-input${error ? ' error' : ''}`}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {isRegister && (
            <div className="form-field">
              <label className="form-label" htmlFor="confirm">Confirmer le mot de passe</label>
              <input
                id="confirm"
                className={`form-input${error ? ' error' : ''}`}
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            className="btn btn-primary btn-lg login-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? isRegister ? 'Création en cours…' : 'Connexion en cours…'
              : isRegister ? 'Créer mon compte' : 'Se connecter'}
          </button>

          <div className="login-divider">
            <span>ou</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-lg login-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.78-2.99-.78-4.59s.27-3.14.78-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            </svg>
            Continuer avec Google
          </button>

          <p className="login-switch">
            {isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
            {' '}
            <button
              type="button"
              className="login-switch-btn"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
            >
              {isRegister ? 'Se connecter' : 'Créer un compte'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
