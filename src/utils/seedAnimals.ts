import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { ANIMALS } from '../data/animals.js'

export async function seedAnimalsIfEmpty(): Promise<void> {
  const snap = await getDocs(collection(db, 'animals'))
  const ids = new Set(snap.docs.map(d => d.id))
  const allPresent = ANIMALS.every(a => ids.has(a.id))
  if (allPresent && snap.size === ANIMALS.length) return

  const batch = writeBatch(db)
  for (const animal of ANIMALS) {
    batch.set(doc(db, 'animals', animal.id), animal)
  }
  await batch.commit()
}
