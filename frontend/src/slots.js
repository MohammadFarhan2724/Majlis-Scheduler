// which part of the day a clock time belongs to (the server uses the same rule)
export function periodOfClock(hhmm) {
  const hour = Number(hhmm.split(':')[0])
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

// "09:45" becomes "9:45 AM" in English, "सुबह 9:45" in Hindi, and so on
export function clockLabel(hhmm, t, lang) {
  const [h, m] = hhmm.split(':').map(Number)
  const h12 = h % 12 === 0 ? 12 : h % 12
  const mm = String(m).padStart(2, '0')
  if (lang === 'en') return `${h12}:${mm} ${h < 12 ? 'AM' : 'PM'}`
  return `${t(`period_${periodOfClock(hhmm)}`)} ${h12}:${mm}`
}

// the readable time of a booking, in the chosen language
export function slotLabel(b, t, lang) {
  if (b.time_slot === 'other' && b.custom_time) {
    return clockLabel(b.custom_time.slice(0, 5), t, lang)
  }
  return t(`slot_${b.time_slot.replace(':', '')}`)
}