export interface Session {
  id: string
  animalIds: string[]
  date: string   // ISO datetime e.g. '2026-05-06T14:00:00'
  structure: string
  handler: string
  notes: string
  status: 'completed' | 'planned' | 'cancelled'
}

