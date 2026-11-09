import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import BookingCard from '../components/BookingCard'
import Loader from '../components/Loader'
import {
  getMutawalliToken,
  mutawalliApi,
  saveMutawalliToken,
} from '../mutawalli'

export default function MutawalliPortal() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hasToken = Boolean(getMutawalliToken())
  const [tab, setTab] = useState('upcoming')
  const [loaded, setLoaded] = useState({ key: '', data: null })
  const [failedKey, setFailedKey] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    if (!hasToken) return undefined
    let cancelled = false
    mutawalliApi(`/mutawalli/bookings/?tab=${tab}`)
      .then((data) => {
        if (cancelled) return
        setFailedKey('')
        setLoaded({ key: tab, data })
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 401 || err.status === 403) {
          navigate('/mutawalli/login', { replace: true })
        } else {
          setFailedKey(tab)
        }
      })
    return () => {
      cancelled = true
    }
  }, [tab, reloadCount, hasToken, navigate])

  if (!hasToken) return <Navigate to="/mutawalli/login" replace />

  const items = loaded.key === tab ? loaded.data : null
  const failed = failedKey === tab

  function retry() {
    setFailedKey('')
    setReloadCount((n) => n + 1)
  }

  function handleLogout() {
    saveMutawalliToken(null)
    navigate('/', { replace: true })
  }

  return (
    <>
      <h1>{t('mutawalliPortal')}</h1>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upcoming'}
          className={tab === 'upcoming' ? 'tab active' : 'tab'}
          onClick={() => setTab('upcoming')}
        >
          {t('upcoming')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'completed'}
          className={tab === 'completed' ? 'tab active' : 'tab'}
          onClick={() => setTab('completed')}
        >
          {t('completed')}
        </button>
      </div>

      {tab === 'completed' && <div className="hint">{t('completedNote')}</div>}

      {failed && (
        <div className="error-box" role="alert">
          {t('errorGeneric')}
          <button type="button" className="btn-secondary small" onClick={retry}>
            {t('tryAgain')}
          </button>
        </div>
      )}
      {!failed && items === null && <Loader />}
      {items && items.length === 0 && (
        <p className="empty-note">{t('emptyList')}</p>
      )}
      {items && items.map((b) => <BookingCard key={b.id} booking={b} />)}

      <button
        type="button"
        className="btn-secondary logout-btn"
        onClick={handleLogout}
      >
        {t('logout')}
      </button>
    </>
  )
}