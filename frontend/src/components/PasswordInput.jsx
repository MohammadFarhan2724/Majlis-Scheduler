import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function PasswordInput({ id, value, onChange, autoComplete }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field">
      <input
        id={id}
        dir="ltr"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="show-btn"
        onClick={() => setVisible(!visible)}
      >
        {visible ? t('hide') : t('show')}
      </button>
    </div>
  )
}