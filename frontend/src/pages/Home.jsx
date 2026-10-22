import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'

export default function Home() {
  const { t } = useTranslation()
  const { isLoggedIn, logout } = useAuth()
  const location = useLocation()
  const saved = Boolean(location.state && location.state.saved)

  return (
    <>
      <h1>{t('appName')}</h1>
      <p>{t('tagline')}</p>
      {saved && (
        <div className="success-box" role="status">
          {t('saved')}
        </div>
      )}
      {isLoggedIn ? (
        <div className="stack">
          <Link className="btn-primary" to="/new">
            {t('scheduleYours')}
          </Link>
          <button type="button" className="btn-secondary" onClick={logout}>
            {t('logout')}
          </button>
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
    </>
  )
}