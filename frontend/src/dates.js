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