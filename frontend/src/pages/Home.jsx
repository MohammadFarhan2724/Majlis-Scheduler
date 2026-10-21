import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'

export default function Home() {
  const { t } = useTranslation()
  const { isLoggedIn, logout } = useAuth()

  return (
    <>
      <h1>{t('appName')}</h1>
      <p>{t('tagline')}</p>
      {isLoggedIn ? (
        <button type="button" className="btn-secondary" onClick={logout}>
          {t('logout')}
        </button>
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