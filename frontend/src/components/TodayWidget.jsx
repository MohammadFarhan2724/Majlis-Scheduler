import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { formatDate } from '../dates'

export default function TodayWidget() {
  const { t, i18n } = useTranslation()
  const [today, setToday] = useState(null)

  useEffect(() => {
    api('/today/')
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