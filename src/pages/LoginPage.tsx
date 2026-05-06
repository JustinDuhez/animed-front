import { useState, FormEvent } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase.js'

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
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() })
        }
      }
    } catch (err: any) {
      setError(getErrorMessage(err.code))
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
