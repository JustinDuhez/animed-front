import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase.js'
import type { Session } from '../data/session.js'
import type { Organization } from '../data/organization.js'

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
}

/** Triggers a Google popup to get a fresh Calendar-scoped access token.
 *  Won't re-prompt if the user already granted the scope. */
export async function requestCalendarToken(): Promise<string> {
  const provider = new GoogleAuthProvider()
  provider.addScope(CALENDAR_SCOPE)
  const result = await signInWithPopup(auth, provider)
  const credential = GoogleAuthProvider.credentialFromResult(result)
  if (!credential?.accessToken) throw new Error('No access token returned')
  return credential.accessToken
}

/** Fetches events from the user's primary Google Calendar for a date range. */
export async function fetchCalendarEvents(
  accessToken: string,
  from: Date,
  to: Date,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin:      from.toISOString(),
    timeMax:      to.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '100',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Calendar API error ${res.status}`)
  }

  const data = await res.json()
  return (data.items ?? []) as CalendarEvent[]
}

/** Tokenizes a string: lowercase, strip accents, remove punctuation, split on whitespace. */
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1)
}

/** Jaccard similarity between two token lists: |A ∩ B| / |A ∪ B|. */
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = [...setA].filter(t => setB.has(t)).length
  const union = new Set([...setA, ...setB]).size
  return intersection / union
}

const MATCH_THRESHOLD = 0.25

/** Finds the best-matching organization for a location string using fuzzy token overlap.
 *  Returns null if no org scores above the threshold. */
export function matchOrganization(location: string, orgs: Organization[]): Organization | null {
  if (!location.trim()) return null
  const locTokens = tokenize(location)

  let bestOrg:   Organization | null = null
  let bestScore  = 0

  for (const org of orgs) {
    const score = Math.max(
      jaccard(locTokens, tokenize(org.address)),
      jaccard(locTokens, tokenize(org.name)),
    )
    if (score > bestScore) { bestScore = score; bestOrg = org }
  }

  return bestScore >= MATCH_THRESHOLD ? bestOrg : null
}

/** Maps a Google Calendar event to a partial AniMed session (no id yet).
 *  If organizations are provided, tries to match the event location to one. */
export function calendarEventToSession(
  event: CalendarEvent,
  orgs: Organization[] = [],
): Omit<Session, 'id'> {
  const dateTime  = event.start.dateTime ?? event.start.date ?? new Date().toISOString()
  const location  = event.location ?? ''
  const matched   = matchOrganization(location, orgs)

  const structure = matched ? matched.name : ''
  const notes     = [
    event.description ?? '',
    !matched && location ? `Adresse : ${location}` : '',
  ].filter(Boolean).join('\n').trim()

  return {
    date:      dateTime,
    structure,
    handler:   '',
    notes,
    animalIds: [],
    status:    'planned',
  }
}
