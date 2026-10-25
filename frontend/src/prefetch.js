import { api } from './api'

const MAX_AGE_MS = 60 * 1000 // reuse a loaded list for one minute

let pending = null
let startedAt = 0
let lastBookings = null
let optionsPromise = null
let lastOptions = null
let lastToday = null

// ---- the home list ----
export function cachedBookings() {
  return lastBookings
}

export function loadBookings(force = false) {
  if (force || !pending || Date.now() - startedAt > MAX_AGE_MS) {
    startedAt = Date.now()
    pending = api('/bookings/').then((data) => {
      lastBookings = data
      return data
    })
  }
  return pending
}

// reload the list after something changed
export function refreshBookings() {
  return loadBookings(true).catch(() => null)
}

// ---- the lists for the booking form (they rarely change) ----
export function cachedOptions() {
  return lastOptions
}

export function loadOptions() {
  if (!optionsPromise) {
    optionsPromise = api('/options/').then((data) => {
      lastOptions = data
      return data
    })
    optionsPromise.catch(() => {
      optionsPromise = null // allow a retry after a failure
    })
  }
  return optionsPromise
}

// ---- today's date widget ----
export function cachedToday() {
  const localToday = new Date().toLocaleDateString('en-CA')
  return lastToday && lastToday.date === localToday ? lastToday : null
}

export function loadToday() {
  return api('/today/').then((data) => {
    lastToday = data
    return data
  })
}