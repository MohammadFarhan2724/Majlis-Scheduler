import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import BookingCard from '../components/BookingCard'
import Loader from '../components/Loader'
import { loadBookings } from '../prefetch'
import { isLiveNow } from '../slots'

export default function Live() {
  const { t } = useTranslation()
  const [bookings, setBookings] = useState(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [now, setNow] = useState(() => new Date())

  // check the phone clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    loadBookings(reloadKey > 0)
      .then((data) => {
        if (!cancelled) setBookings(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function retry() {
    setFailed(false)
    setBookings(null)
    setReloadKey((k) => k + 1)
  }

  const live = bookings ? bookings.filter((b) => isLiveNow(b, now)) : []

  function footerFor(b) {
    return (
      <div className="card-actions">
        {b.youtube_url ? (
          <a
            className="btn-youtube"
            href={b.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('watchYoutube')}
          </a>
        ) : (
          <div className="hint">{t('notLiveOnYoutube')}</div>
        )}
      </div>
    )
  }

  return (
    <>
      <Link className="back-link" to="/">
        {t('back')}
      </Link>
      <h1 className="live-title">
        <span className="live-dot" aria-hidden="true" />
        {t('liveMajlis')}
      </h1>

      {failed && (
        <div className="error-box" role="alert">
          {t('errorGeneric')}
          <button type="button" className="btn-secondary small" onClick={retry}>
            {t('tryAgain')}
          </button>
        </div>
      )}
      {!failed && bookings === null && <Loader />}
      {bookings && live.length === 0 && (
        <p className="empty-note">{t('noLiveNow')}</p>
      )}
      {live.map((b) => (
        <BookingCard key={b.id} booking={b} footer={footerFor(b)} />
      ))}
    </>
  )
}