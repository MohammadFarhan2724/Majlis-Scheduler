import { api } from './api'

const MAX_AGE_MS = 60 * 1000 // reuse a loaded list for one minute

let pending = null
let startedAt = 0

// returns a promise of the home list, and starts the request only when needed
export function loadBookings(force = false) {
  if (force || !pending || Date.now() - startedAt > MAX_AGE_MS) {
    startedAt = Date.now()
    pending = api('/bookings/')
  }
  return pending
}

// call this after a booking is created, edited or deleted
export function invalidateBookings() {
  pending = null
}