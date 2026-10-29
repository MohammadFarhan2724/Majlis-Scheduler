import { api } from './api'

const MAX_AGE_MS = 60 * 1000 // reuse loaded data for one minute

let pending = null
let startedAt = 0
let lastBookings = null
let optionsPromise = null
let lastOptions = null
let lastToday = null
const calendarCache = new Map()

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

// reload after something changed (also forgets the calendar months)
export function refreshBookings() {
  calendarCache.clear()
  return loadBookings(true).catch(() => null)
}

export function invalidateBookings() {
  pending = null
  lastBookings = null
  calendarCache.clear()
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

// ---- one calendar month: Islamic dates and booked parts of each day ----
export function loadCalendar(year, month) {
  const key = `${year}-${String(month).padStart(2, '0')}`
  const hit = calendarCache.get(key)
  if (hit && Date.now() - hit.startedAt < MAX_AGE_MS) return hit.promise
  const promise = api(`/calendar/?year=${year}&month=${month}`)
  promise.catch(() => calendarCache.delete(key))
  calendarCache.set(key, { startedAt: Date.now(), promise })
  return promise
}