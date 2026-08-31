import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase.js'
import type { Session } from '../data/session.js'

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

/** Maps a Google Calendar event to a partial AniMed session (no id yet). */
export function calendarEventToSession(event: CalendarEvent): Omit<Session, 'id'> {
  const dateTime = event.start.dateTime ?? event.start.date ?? new Date().toISOString()
  return {
    date:      dateTime,
    structure: event.location ?? '',
    handler:   '',
    notes:     event.description ?? '',
    animalIds: [],
    status:    'planned',
  }
}
