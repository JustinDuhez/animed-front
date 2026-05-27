import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { SESSIONS } from '../data/animals.js'

export async function seedSessionsIfEmpty(): Promise<void> {
  const snap = await getDocs(collection(db, 'sessions'))
  if (!snap.empty) return

  const batch = writeBatch(db)
  for (const session of SESSIONS) {
    batch.set(doc(db, 'sessions', session.id), session)
  }
  await batch.commit()
}
