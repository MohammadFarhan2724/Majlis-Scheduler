import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import BookingCard from '../components/BookingCard'
import { refreshBookings } from '../prefetch'

export default function Account() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [me, setMe] = useState(null)
  const [kind, setKind] = useState('majlis')
  const [tab, setTab] = useState('upcoming')
  const [loaded, setLoaded] = useState({ key: '', data: null })
  const [failedKey, setFailedKey] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [confirmingId, setConfirmingId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [showSaved, setShowSaved] = useState(
    Boolean(location.state && location.state.saved),
  )

  const key = `${kind}-${tab}`

  // the "Saved" message vanishes after 4 seconds
  useEffect(() => {
    if (!showSaved) return undefined
    window.history.replaceState({ ...window.history.state, usr: null }, '')
    const timer = setTimeout(() => setShowSaved(false), 4000)
    return () => clearTimeout(timer)
  }, [showSaved])

  useEffect(() => {
    api('/me/')
      .then(setMe)
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    api(`/bookings/mine/?kind=${kind}&tab=${tab}`)
      .then((data) => {
        if (cancelled) return
        setFailedKey('')
        setLoaded({ key, data })
      })
      .catch(() => {
        if (!cancelled) setFailedKey(key)
      })
    return () => {
      cancelled = true
    }
  }, [key, kind, tab, reloadCount])

  const items = loaded.key === key ? loaded.data : null
  const failed = failedKey === key

  function retry() {
    setFailedKey('')
    setReloadCount((n) => n + 1)
  }

  async function removeBooking(id) {
    setActionError('')
    try {
      await api(`/bookings/${id}/`, { method: 'DELETE' })
      refreshBookings()
      setLoaded((old) => ({
        ...old,
        data: old.data ? old.data.filter((b) => b.id !== id) : old.data,
      }))
      setConfirmingId(null)
    } catch {
      setActionError(t('errorGeneric'))
    }
  }

  function footerFor(b) {
    if (confirmingId === b.id) {
      return (
        <div className="card-actions">
          <div className="confirm-text">{t('confirmDelete')}</div>
          <div className="action-row">
            <button
              type="button"
              className="danger-btn"
              onClick={() => removeBooking(b.id)}
            >
              {t('yesDelete')}
            </button>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => setConfirmingId(null)}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="card-actions">
        <div className="action-row">
          {tab === 'upcoming' && (
            <Link className="btn-secondary small" to={`/edit/${b.id}`}>
              {t('edit')}
            </Link>
          )}
          <button
            type="button"
            className="danger-outline-btn"
            onClick={() => setConfirmingId(b.id)}
          >
            {t('delete')}
          </button>
        </div>
      </div>
    )
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      <Link className="back-link" to="/">
        {t('back')}
      </Link>
      <h1>{t('myAccount')}</h1>

      {showSaved && (
        <div className="success-box" role="status">
          {t('saved')}
        </div>
      )}

      {me && (
        <div className="profile-box">
          <div className="profile-name" dir="auto">
            {me.name}
          </div>
          <div className="profile-mobile" dir="ltr">
            {me.mobile}
          </div>
        </div>
      )}

      <div className="toggle-row">
        <button
          type="button"
          className={kind === 'majlis' ? 'lang-btn active' : 'lang-btn'}
          onClick={() => setKind('majlis')}
        >
          {t('myMajlis')}
        </button>
        <button
          type="button"
          className={kind === 'mehfil' ? 'lang-btn active' : 'lang-btn'}
          onClick={() => setKind('mehfil')}
        >
          {t('myMehfil')}
        </button>
      </div>

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
      {actionError && (
        <div className="error-box" role="alert">
          {actionError}
        </div>
      )}

      {failed && (
        <div className="error-box" role="alert">
          {t('errorGeneric')}
          <button type="button" className="btn-secondary small" onClick={retry}>
            {t('tryAgain')}
          </button>
        </div>
      )}
      {!failed && items === null && <p>{t('pleaseWait')}</p>}
      {items && items.length === 0 && <p className="empty-note">{t('emptyList')}</p>}
      {items &&
        items.map((b) => (
          <BookingCard key={b.id} booking={b} footer={footerFor(b)} />
        ))}
      <Link className="btn-secondary logout-btn" to="/change-password">
        {t('changePassword')}
      </Link>
      <button type="button" className="btn-secondary logout-btn" onClick={handleLogout}>
        {t('logout')}
      </button>
    </>
  )
}