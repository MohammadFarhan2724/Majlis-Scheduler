import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { errorText } from '../api'
import PasswordInput from '../components/PasswordInput'

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register(name.trim(), mobile, password)
      navigate('/')
    } catch (err) {
      setError(errorText(err, t('errorGeneric')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1>{t('register')}</h1>
      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">{t('name')}</label>
          <input
            id="name"
            dir="auto"
            type="text"
            maxLength={100}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
            autoComplete="new-password"
          />
          <div className="hint">{t('passwordHelp')}</div>
        </div>
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? t('pleaseWait') : t('register')}
        </button>
      </form>
      <p className="switch-link">
        {t('haveAccount')} <Link to="/login">{t('login')}</Link>
      </p>
    </>
  )
}