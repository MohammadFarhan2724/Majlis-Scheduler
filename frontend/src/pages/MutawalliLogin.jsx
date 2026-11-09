import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { translateError } from '../api'
import PasswordInput from '../components/PasswordInput'
import {
  getMutawalliToken,
  mutawalliLogin,
  saveMutawalliToken,
} from '../mutawalli'

export default function MutawalliLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (getMutawalliToken()) return <Navigate to="/mutawalli" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await mutawalliLogin(username.trim(), password)
      if (!data.is_mutawalli) {
        setError(t('mutawalliNotAllowed'))
        setBusy(false)
        return
      }
      saveMutawalliToken(data.token)
      navigate('/mutawalli', { replace: true })
    } catch (err) {
      setError(translateError(err, t))
      setBusy(false)
    }
  }

  return (
    <>
      <h1>{t('mutawalliLogin')}</h1>
      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="username">{t('mutawalliUsername')}</label>
          <input
            id="username"
            dir="ltr"
            type="text"
            autoCapitalize="none"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
    </>
  )
}