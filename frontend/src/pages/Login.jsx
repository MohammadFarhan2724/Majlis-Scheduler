import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { errorText } from '../api'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(mobile, password)
      navigate('/')
    } catch (err) {
      setError(errorText(err, t('errorGeneric')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1>{t('login')}</h1>
      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="mobile">{t('mobile')}</label>
          <input
            id="mobile"
            dir="ltr"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="username"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
            required
          />
          <div className="hint">{t('mobileHelp')}</div>
        </div>
        <div className="field">
          <label htmlFor="password">{t('password')}</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? t('pleaseWait') : t('login')}
        </button>
      </form>
      <p className="switch-link">
        {t('newHere')} <Link to="/register">{t('register')}</Link>
      </p>
    </>
  )
}