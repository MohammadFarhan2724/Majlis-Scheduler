const LOCALES = { en: 'en-IN', hi: 'hi-IN', ur: 'ur-IN' }

// dateString looks like "2026-10-25"
export function formatDate(dateString, lang, withWeekday = false) {
  const [y, m, d] = dateString.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(LOCALES[lang] || 'en-IN', {
    weekday: withWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// short weekday names starting from Sunday
export function weekdayNames(lang) {
  const locale = LOCALES[lang] || 'en-IN'
  // 1 January 2023 was a Sunday
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }),
  )
}

export function monthTitle(year, month, lang) {
  return new Date(year, month - 1, 1).toLocaleDateString(
    LOCALES[lang] || 'en-IN',
    { month: 'long', year: 'numeric' },
  )
}

function pad(n) {
  return String(n).padStart(2, '0')
}

// today as "YYYY-MM-DD" in the phone's local time
export function todayString() {
  return new Date().toLocaleDateString('en-CA')
}

// "2026-10-25" plus n days
export function addDays(dateString, n) {
  const [y, m, d] = dateString.split('-').map(Number)
  const date = new Date(y, m - 1, d + n)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// short form for cards: "Sun, 1 Nov 2026"
export function formatDateShort(dateString, lang) {
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(LOCALES[lang] || 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}