import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { monthTitle, weekdayNames } from '../dates'
import { loadCalendar } from '../prefetch'

const MAX_MONTHS_AHEAD = 18

function pad(n) {
  return String(n).padStart(2, '0')
}

// today: "YYYY-MM-DD", also the first day that can be chosen
// ownDate: the date of the booking being edited (its own day stays choosable)
export default function DatePicker({ value, onChange, today, ownDate, mode = 'book' }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const filterMode = mode === 'filter'
  const hijriMonths = t('hijriMonths', { returnObjects: true })

  const [todayYear, todayMonth] = today.split('-').map(Number)
  const minIndex = todayYear * 12 + (todayMonth - 1)
  const maxIndex = minIndex + MAX_MONTHS_AHEAD

  const [viewIndex, setViewIndex] = useState(() => {
    const [y, m] = (value || today).split('-').map(Number)
    return y * 12 + (m - 1)
  })
  const year = Math.floor(viewIndex / 12)
  const month = (viewIndex % 12) + 1
  const key = `${year}-${pad(month)}`

  const [loaded, setLoaded] = useState({})

  useEffect(() => {
    let cancelled = false
    loadCalendar(year, month)
      .then((days) => {
        if (!cancelled) setLoaded((old) => ({ ...old, [key]: days }))
      })
      .catch(() => {
        // if loading fails, still allow choosing; the server checks on submit
        if (!cancelled) setLoaded((old) => ({ ...old, [key]: [] }))
      })
    return () => {
      cancelled = true
    }
  }, [year, month, key])

  const days = loaded[key]
  const byDate = useMemo(() => {
    const map = {}
    if (days) {
      for (const d of days) map[d.date] = d
    }
    return map
  }, [days])

  // the Islamic month(s) of this Gregorian month, shown under the title
  let islamicRange = ''
  if (days && days.length > 0) {
    const a = days[0].hijri
    const b = days[days.length - 1].hijri
    if (a.month === b.month) {
      islamicRange = `${hijriMonths[a.month - 1]} ${a.year}`
    } else if (a.year === b.year) {
      islamicRange = `${hijriMonths[a.month - 1]} – ${hijriMonths[b.month - 1]} ${b.year}`
    } else {
      islamicRange = `${hijriMonths[a.month - 1]} ${a.year} – ${hijriMonths[b.month - 1]} ${b.year}`
    }
  }

  const firstWeekday = new Date(year, month - 1, 1).getDay() // 0 = Sunday
  const count = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= count; d += 1) cells.push(d)

  return (
    <div className="cal">
      <div className="cal-head">
        <button
          type="button"
          className="cal-nav"
          aria-label={t('calPrev')}
          disabled={viewIndex <= minIndex}
          onClick={() => setViewIndex(viewIndex - 1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="cal-title">
          {monthTitle(year, month, lang)}
          <span className="cal-sub">{islamicRange}</span>
        </div>
        <button
          type="button"
          className="cal-nav"
          aria-label={t('calNext')}
          disabled={viewIndex >= maxIndex}
          onClick={() => setViewIndex(viewIndex + 1)}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="cal-grid">
        {weekdayNames(lang).map((w, i) => (
          <div className="cal-week" key={`w${i}`}>
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} />
          const dateStr = `${key}-${pad(d)}`
          const info = byDate[dateStr]
          const past = dateStr < today
          const isOwn = dateStr === ownDate
          const full = !filterMode && Boolean(info && info.full && !isOwn)
          const partial = filterMode
            ? Boolean(info && info.taken.length > 0)
            : Boolean(info && !info.full && info.taken.length > 0)
          const classes = ['cal-day']
          if (dateStr === value) classes.push('selected')
          if (dateStr === today) classes.push('today')
          if (past) classes.push('past')
          if (full) classes.push('full')
          if (partial) classes.push('partial')
          if (info && info.hijri.day === 1) classes.push('new-month')
          return (
            <button
              type="button"
              key={dateStr}
              className={classes.join(' ')}
              disabled={past || full || !days}
              aria-pressed={dateStr === value}
              onClick={() => onChange(dateStr)}
            >
              <span className="g">{d}</span>
              <span className="h">{info ? info.hijri.day : ''}</span>
            </button>
          )
        })}
      </div>

      {!days && <div className="hint">{t('pleaseWait')}</div>}

      <div className="cal-legend">
        {filterMode ? (
          <span>
            <i className="dot partial" />
            {t('calHasMajlis')}
          </span>
        ) : (
          <>
            <span>
              <i className="dot free" />
              {t('calFree')}
            </span>
            <span>
              <i className="dot partial" />
              {t('calPartial')}
            </span>
            <span>
              <i className="dot full" />
              {t('calFull')}
            </span>
          </>
        )}
      </div>
    </div>
  )
}