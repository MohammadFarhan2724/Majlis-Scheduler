import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, mediaPath } from '../api'
import { formatDate } from '../dates'

export default function BookingDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [booking, setBooking] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    api(`/bookings/${id}/`)
      .then((data) => {
        if (!cancelled) setBooking(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const back = (
    <Link className="back-link" to="/">
      {t('back')}
    </Link>
  )

  if (failed) {
    return (
      <>
        {back}
        <div className="error-box">{t('notFound')}</div>
      </>
    )
  }
  if (!booking) {
    return (
      <>
        {back}
        <p>{t('pleaseWait')}</p>
      </>
    )
  }

  const b = booking
  const months = t('hijriMonths', { returnObjects: true })
  const h = b.hijri_date
  const title =
    b.category === 'other' ? b.other_category : t(`${b.kind}_${b.category}`)
  const venue = b.venue_detail
    ? b.venue_detail[`name_${lang}`] || b.venue_detail.name_en
    : b.other_venue
  const mapUrl =
    (b.venue_detail && b.venue_detail.map_url) ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`

  return (
    <>
      {back}
      <article className="card">
        <span className="badge">
          {b.kind === 'majlis' ? t('kindMajlis') : t('kindMehfil')}
        </span>
        <h1 className="detail-title" dir="auto">
          {title}
        </h1>

        <div className="card-date">{formatDate(b.date, lang, true)}</div>
        <div className="card-hijri">
          {h.day} {months[h.month - 1]} {h.year} {t('hijriSuffix')}
        </div>
        <div className="card-time">
          {t(`slot_${b.time_slot.replace(':', '')}`)}
        </div>

        <dl className="card-details">
          <dt>{t('venue')}</dt>
          <dd dir="auto">{venue}</dd>
          <dt>{t('organizer')}</dt>
          <dd dir="auto">{b.organizer_name}</dd>
          <dt>{t('khitabat')}</dt>
          <dd dir="auto">{b.khitabat}</dd>
          {b.marhoomeen.length > 0 && (
            <>
              <dt>{t('isaalFor')}</dt>
              <dd>
                <ul className="detail-names">
                  {b.marhoomeen.map((name, i) => (
                    <li key={i} dir="auto">
                      {name}
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          )}
          {b.after_majlis && (
            <>
              <dt>{t('afterMajlis')}</dt>
              <dd dir="auto">{b.after_majlis}</dd>
            </>
          )}
        </dl>

        <a
          className="btn-secondary map-btn"
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t('openMap')}
        </a>

        <a href={mediaPath(b.parcha)} target="_blank" rel="noreferrer">
          <img className="parcha" src={mediaPath(b.parcha)} alt="" />
        </a>

        <p className="card-note">{t('defaultNote')}</p>
      </article>
    </>
  )
}