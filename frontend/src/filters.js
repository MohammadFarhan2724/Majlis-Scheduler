import { addDays } from './dates'

export const EMPTY_FILTERS = { q: '', type: '', venue: '', when: '', date: '' }

export function hasFilters(f) {
  return Boolean(f.q.trim() || f.type || f.venue || f.when)
}

function venueNames(b) {
  const v = b.venue_detail
  return v ? [v.name_en, v.name_hi, v.name_ur] : [b.other_venue]
}

// does one booking pass all the chosen filters?
export function matches(b, f, today, t) {
  if (f.type.startsWith('kind:')) {
    if (b.kind !== f.type.slice(5)) return false
  } else if (f.type.startsWith('cat:')) {
    const [, kind, code] = f.type.split(':')
    if (b.kind !== kind || b.category !== code) return false
  }

  if (f.venue === 'other') {
    if (b.venue) return false
  } else if (f.venue && String(b.venue) !== f.venue) {
    return false
  }

  if (f.when === 'today' && b.date !== today) return false
  if (f.when === 'tomorrow' && b.date !== addDays(today, 1)) return false
  if (f.when === 'week' && (b.date < today || b.date > addDays(today, 6))) {
    return false
  }
  if (f.when === 'date' && f.date && b.date !== f.date) return false

  const q = f.q.trim().toLowerCase()
  if (q) {
    const title =
      b.category === 'other' ? b.other_category : t(`${b.kind}_${b.category}`)
    const text = [
      title,
      b.organizer_name,
      b.sogwaran,
      b.khitabat,
      b.after_majlis,
      ...venueNames(b),
      ...b.marhoomeen,
    ]
      .join(' ')
      .toLowerCase()
    if (!text.includes(q)) return false
  }
  return true
}