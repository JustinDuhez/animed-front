import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase.js'
import type { Role } from '../data/user.js'

export type { Role }

interface AuthState {
  role:          Role | null
  isGoogleUser:  boolean
  displayName:   string
}

const RoleContext = createContext<AuthState>({ role: null, isGoogleUser: false, displayName: '' })

export function RoleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ role: null, isGoogleUser: false, displayName: '' })

  useEffect(() => {
    let unsubSnap: (() => void) | undefined

    const unsubAuth = onAuthStateChanged(auth, user => {
      unsubSnap?.()
      if (!user) { setState({ role: null, isGoogleUser: false, displayName: '' }); return }

      const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com')

      unsubSnap = onSnapshot(doc(db, 'users', user.uid), async snap => {
        if (!snap.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            email:       user.email       ?? '',
            displayName: user.displayName ?? '',
            role:        'viewer',
            createdAt:   new Date().toISOString(),
          })
          return
        }
        setState({
          role:        (snap.data()?.role as Role) ?? 'viewer',
          isGoogleUser,
          displayName: (snap.data()?.displayName as string) ?? '',
        })
      })
    })

    return () => { unsubAuth(); unsubSnap?.() }
  }, [])

  return <RoleContext.Provider value={state}>{children}</RoleContext.Provider>
}

export function useRole(): Role | null {
  return useContext(RoleContext).role
}

export function useIsGoogleUser(): boolean {
  return useContext(RoleContext).isGoogleUser
}

export function useDisplayName(): string {
  return useContext(RoleContext).displayName
}
