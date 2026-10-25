import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../dates'
import { cachedToday, loadToday } from '../prefetch'

export default function TodayWidget() {
  const { t, i18n } = useTranslation()
  const [today, setToday] = useState(() => cachedToday())

  useEffect(() => {
    loadToday()
      .then(setToday)
      .catch(() => {})
  }, [])

  if (!today) return null

  const months = t('hijriMonths', { returnObjects: true })
  const h = today.hijri

  return (
    <div className="today">
      <div className="greg">{formatDate(today.date, i18n.language, true)}</div>
      <div className="hijri">
        {h.day} {months[h.month - 1]} {h.year} {t('hijriSuffix')}
      </div>
    </div>
  )
}