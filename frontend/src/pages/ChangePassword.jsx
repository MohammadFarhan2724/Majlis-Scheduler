import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { translateError } from '../api'
import PasswordInput from '../components/PasswordInput'

export default function ChangePassword() {
  const { t } = useTranslation()
  const { changePassword, mustChangePassword } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPassword !== again) {
      setError(t('passwordsDontMatch'))
      return
    }
    setBusy(true)
    try {
      await changePassword(oldPassword, newPassword)
      setDone(true)
    } catch (err) {
      setError(translateError(err, t))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <>
        <h1>{t('changePassword')}</h1>
        <div className="success-box" role="status">
          {t('passwordChanged')}
        </div>
        <Link className="btn-primary" to="/">
          {t('back')}
        </Link>
      </>
    )
  }

  return (
    <>
      {!mustChangePassword && (
        <Link className="back-link" to="/account">
          {t('back')}
        </Link>
      )}
      <h1>{t('changePassword')}</h1>
      {mustChangePassword && <div className="info-box">{t('forcedChange')}</div>}
      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="old">{t('oldPassword')}</label>
          <PasswordInput
            id="old"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="field">
          <label htmlFor="new">{t('newPassword')}</label>
          <PasswordInput
            id="new"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <div className="hint">{t('passwordHelp')}</div>
        </div>
        <div className="field">
          <label htmlFor="again">{t('confirmPassword')}</label>
          <PasswordInput
            id="again"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? t('pleaseWait') : t('changePassword')}
        </button>
      </form>
    </>
  )
}