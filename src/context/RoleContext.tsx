import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase.js'
import type { Role } from '../data/user.js'

export type { Role }

const RoleContext = createContext<Role | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)

  useEffect(() => {
    let unsubSnap: (() => void) | undefined

    const unsubAuth = onAuthStateChanged(auth, user => {
      unsubSnap?.()
      if (!user) { setRole(null); return }

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
        setRole((snap.data()?.role as Role) ?? 'viewer')
      })
    })

    return () => { unsubAuth(); unsubSnap?.() }
  }, [])

  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useRole(): Role | null {
  return useContext(RoleContext)
}
