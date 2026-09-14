import { collection, query, where, type QueryConstraint, type Query, type DocumentData } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Role } from '../context/RoleContext.js'

/** Non-admins can only read sessions where they're the handler (enforced by firestore.rules) —
 *  build the query accordingly so the client asks for exactly what it's allowed to read, instead
 *  of getting a blanket permission-denied from an unscoped collection read. */
export function sessionsQuery(role: Role | null, displayName: string, ...extra: QueryConstraint[]): Query<DocumentData> {
  const base = collection(db, 'sessions')
  const constraints = role === 'admin' ? extra : [where('handler', '==', displayName), ...extra]
  return query(base, ...constraints)
}
