import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Animal, Session } from '../data/animals.js'

function generateSessionsForAnimal(animal: Animal): Session[] {
  const result: Session[] = []
  const now = new Date()

  for (const [yearMonth, count] of Object.entries(animal.sessions)) {
    if (count === 0) continue
    const [y, m] = yearMonth.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const hours = [9, 10, 14, 15]

    for (let i = 0; i < count; i++) {
      const day = Math.round((i + 1) * (daysInMonth / (count + 1)))
      const date = new Date(y, m - 1, day, hours[i % hours.length], 0)
      const structure = animal.establishments.length > 0
        ? animal.establishments[i % animal.establishments.length]
        : '—'

      result.push({
        id: `ses-${animal.id.toLowerCase().replace(/[^a-z0-9]/g, '')}-${yearMonth}-${i + 1}`,
        animalId: animal.id,
        date: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours[i % hours.length]).padStart(2, '0')}:00:00`,
        structure,
        handler: animal.handler === '—' ? '' : animal.handler,
        notes: '',
        status: date < now ? 'completed' : 'planned',
      })
    }
  }

  if (animal.nextSession) {
    const nextId = `ses-${animal.id.toLowerCase().replace(/[^a-z0-9]/g, '')}-next`
    if (!result.find(s => s.id === nextId)) {
      result.push({
        id: nextId,
        animalId: animal.id,
        date: animal.nextSession.date.length === 16
          ? `${animal.nextSession.date}:00`
          : animal.nextSession.date,
        structure: animal.nextSession.structure,
        handler: animal.handler === '—' ? '' : animal.handler,
        notes: '',
        status: 'planned',
      })
    }
  }

  return result
}

export async function seedSessionsIfEmpty(): Promise<void> {
  const existingSnap = await getDocs(collection(db, 'sessions'))
  if (!existingSnap.empty) return

  const animalsSnap = await getDocs(collection(db, 'animals'))
  const animals = animalsSnap.docs.map(d => d.data() as Animal)

  const sessions = animals.flatMap(generateSessionsForAnimal)
  if (sessions.length === 0) return

  // Firestore batches are limited to 500 operations
  for (let i = 0; i < sessions.length; i += 500) {
    const batch = writeBatch(db)
    for (const s of sessions.slice(i, i + 500)) {
      batch.set(doc(db, 'sessions', s.id), s)
    }
    await batch.commit()
  }
}
