import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadBookings } from '../prefetch'
import { useAuth } from '../auth/AuthContext'
import BookingCard from '../components/BookingCard'
import TodayWidget from '../components/TodayWidget'

const PERIODS = ['morning', 'afternoon', 'evening']

// soonest first; on the same day: morning, afternoon, evening
function sortBookings(list) {
  return [...list].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period),
  )
}

export default function Home() {
  const { t } = useTranslation()
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  const [showSaved, setShowSaved] = useState(
    Boolean(location.state && location.state.saved),
  )

  useEffect(() => {
    if (!showSaved) return undefined
    // clear the router state, so a page reload does not show the message again
    window.history.replaceState({ ...window.history.state, usr: null }, '')
    const timer = setTimeout(() => setShowSaved(false), 4000)
    return () => clearTimeout(timer)
  }, [showSaved])

  const [bookings, setBookings] = useState(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
      loadBookings(reloadKey > 0)
      .then((data) => {
        if (!cancelled) setBookings(sortBookings(data))
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

  return (
    <>
      <h1>{t('appName')}</h1>
      <TodayWidget />

      {showSaved && (
        <div className="success-box" role="status">
          {t('saved')}
        </div>
      )}

      {isLoggedIn ? (
                <div className="stack">
          <Link className="btn-primary" to="/new">
            {t('scheduleYours')}
          </Link>
          <Link className="btn-secondary" to="/account">
            {t('myAccount')}
          </Link>
        </div>
      ) : (
        <div className="stack">
          <Link className="btn-primary" to="/login">
            {t('login')}
          </Link>
          <Link className="btn-secondary" to="/register">
            {t('register')}
          </Link>
        </div>
      )}

      <h2 className="list-title">{t('upcomingTitle')}</h2>

      {failed && (
        <div className="error-box" role="alert">
          {t('errorGeneric')}
          <button type="button" className="btn-secondary small" onClick={retry}>
            {t('tryAgain')}
          </button>
        </div>
      )}
      {!failed && bookings === null && <p>{t('pleaseWait')}</p>}
      {bookings && bookings.length === 0 && <p>{t('noUpcoming')}</p>}
      {bookings &&
        bookings.map((b) => <BookingCard key={b.id} booking={b} />)}

      {isLoggedIn && (
        <button type="button" className="btn-secondary logout-btn" onClick={logout}>
          {t('logout')}
        </button>
      )}
    </>
  )
}