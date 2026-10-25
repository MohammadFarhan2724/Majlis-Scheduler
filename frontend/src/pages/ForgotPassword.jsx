import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, translateError } from '../api'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/password-reset-request/', {
        method: 'POST',
        body: { mobile },
      })
      setSent(true)
    } catch (err) {
      setError(translateError(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Link className="back-link" to="/login">
        {t('back')}
      </Link>
      <h1>{t('forgotTitle')}</h1>

      {sent ? (
        <div className="success-box" role="status">
          {t('requestSent')}
        </div>
      ) : (
        <>
          <div className="info-box">{t('forgotHelp')}</div>
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
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? t('pleaseWait') : t('sendRequest')}
            </button>
          </form>
        </>
      )}
    </>
  )
}