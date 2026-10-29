import { formatDate } from './dates'

// "after Namaz" slots have no exact time, so the calendar uses these
const APPROX_TIMES = { after_zohrain: '13:30', after_maghribain: '19:30' }
const EVENT_MINUTES = 120

function pad(n) {
  return String(n).padStart(2, '0')
}

function appLink(b) {
  return `${window.location.origin}/majlis/${b.id}`
}

// all the readable parts of a booking, in the chosen language
function describe(b, t, lang) {
  const months = t('hijriMonths', { returnObjects: true })
  const h = b.hijri_date
  const title =
    b.category === 'other' ? b.other_category : t(`${b.kind}_${b.category}`)
  const venue = b.venue_detail
    ? b.venue_detail[`name_${lang}`] || b.venue_detail.name_en
    : b.other_venue

  const detailLines = [`${t('khitabatShort')}: ${b.khitabat}`]
  if (b.sogwaran) detailLines.push(`${t('sogwaran')}: ${b.sogwaran}`)
  else if (b.organizer_name)
    detailLines.push(`${t('organizerShort')}: ${b.organizer_name}`)
  if (b.marhoomeen.length > 0)
    detailLines.push(`${t('isaalFor')} ${b.marhoomeen.join(', ')}`)
  if (b.after_majlis) detailLines.push(`${t('afterMajlis')}: ${b.after_majlis}`)
  detailLines.push(t('defaultNote'))

  return {
    title,
    venue,
    gregorian: formatDate(b.date, lang, true),
    islamic: `${h.day} ${months[h.month - 1]} ${h.year} ${t('hijriSuffix')}`,
    slotLabel: t(`slot_${b.time_slot.replace(':', '')}`),
    detailLines,
  }
}

// ---------- WhatsApp ----------

export function shareText(b, t, lang) {
  const d = describe(b, t, lang)
  return [
    `*${d.title}*`,
    `📅 ${d.gregorian}`,
    `🌙 ${d.islamic}`,
    `🕘 ${d.slotLabel}`,
    `📍 ${d.venue}`,
    '',
    ...d.detailLines,
    '',
    appLink(b),
  ].join('\n')
}

export function whatsappUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

// sharing a picture works only on secure (https) addresses
export function canShareFiles() {
  try {
    const probe = new File([''], 'a.jpg', { type: 'image/jpeg' })
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

export async function sharePicture(b, text, imagePath) {
  const res = await fetch(imagePath)
  const blob = await res.blob()
  const file = new File([blob], `majlis-${b.id}.jpg`, {
    type: blob.type || 'image/jpeg',
  })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], text })
    return true
  }
  return false
}

// ---------- calendar ----------

function eventTimes(b) {
  const hhmm = APPROX_TIMES[b.time_slot] || b.time_slot
  const [hour, minute] = hhmm.split(':').map(Number)
  const [y, m, d] = b.date.split('-').map(Number)
  const format = (date) =>
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  return {
    start: format(new Date(y, m - 1, d, hour, minute)),
    end: format(new Date(y, m - 1, d, hour, minute + EVENT_MINUTES)),
  }
}

function summaryOf(b, d) {
  return b.time_slot.startsWith('after') ? `${d.title} – ${d.slotLabel}` : d.title
}

function detailsOf(b, d) {
  return [d.gregorian, d.islamic, d.slotLabel, '', ...d.detailLines, '', appLink(b)].join('\n')
}

export function googleCalendarUrl(b, t, lang) {
  const d = describe(b, t, lang)
  const { start, end } = eventTimes(b)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summaryOf(b, d),
    dates: `${start}/${end}`,
    details: detailsOf(b, d),
    location: d.venue,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function escapeText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// long lines are folded, as the calendar format requires
function fold(line) {
  const parts = []
  let i = 0
  while (i < line.length) {
    const size = i === 0 ? 60 : 59
    parts.push((i === 0 ? '' : ' ') + line.slice(i, i + size))
    i += size
  }
  return parts.join('\r\n')
}

function icsContent(b, t, lang) {
  const d = describe(b, t, lang)
  const { start, end } = eventTimes(b)
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Majlis Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:majlis-${b.id}@majlis-scheduler`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(summaryOf(b, d))}`,
    `LOCATION:${escapeText(d.venue)}`,
    `DESCRIPTION:${escapeText(detailsOf(b, d))}`,
    `URL:${appLink(b)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(d.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function downloadIcs(b, t, lang) {
  const blob = new Blob([icsContent(b, t, lang)], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `majlis-${b.id}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}