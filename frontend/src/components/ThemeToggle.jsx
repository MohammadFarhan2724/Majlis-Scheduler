import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyTheme, getThemeChoice, saveTheme } from '../theme'

export default function ThemeToggle() {
  const { t } = useTranslation()
  const [choice, setChoice] = useState(() => getThemeChoice())

  function change(e) {
    const next = e.target.value
    setChoice(next)
    saveTheme(next)
    applyTheme(next)
  }

  return (
    <select
      className="theme-select"
      value={choice}
      onChange={change}
      aria-label={t('themeLabel')}
    >
      <option value="system">🖥 {t('systemMode')}</option>
      <option value="light">☀️ {t('lightMode')}</option>
      <option value="dark">🌙 {t('darkMode')}</option>
    </select>
  )
}