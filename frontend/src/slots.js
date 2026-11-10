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

// how long a majlis shows as "live" after it starts (in minutes)
export const LIVE_MINUTES = 120

// slots with no fixed time use these. Change AFTER_MAGHRIBAIN in summer
// (the prayer moves later, up to about 7:17 PM)
const AFTER_ZOHRAIN = '13:15'
const AFTER_MAGHRIBAIN = '18:15'

function startClock(b) {
  if (b.time_slot === 'after_zohrain') return AFTER_ZOHRAIN
  if (b.time_slot === 'after_maghribain') return AFTER_MAGHRIBAIN
  if (b.time_slot === 'other') {
    return b.custom_time ? b.custom_time.slice(0, 5) : null
  }
  return b.time_slot // example: "19:00"
}

// today's date on the phone, as YYYY-MM-DD
function localDateKey(now) {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

// true if this booking is being held right now (by the phone's clock)
export function isLiveNow(b, now = new Date()) {
  if (b.date !== localDateKey(now)) return false
  const clock = startClock(b)
  if (!clock || !clock.includes(':')) return false
  const [h, m] = clock.split(':').map(Number)
  const start = h * 60 + m
  const current = now.getHours() * 60 + now.getMinutes()
  return current >= start && current < start + LIVE_MINUTES
}