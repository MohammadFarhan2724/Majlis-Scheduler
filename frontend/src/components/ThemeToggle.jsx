import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyTheme, saveTheme } from '../theme'

export default function ThemeToggle() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'light',
  )

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    saveTheme(next)
    setTheme(next)
  }

  return (
    <button type="button" className="theme-btn" onClick={toggle}>
      {theme === 'dark' ? `☀️ ${t('lightMode')}` : `🌙 ${t('darkMode')}`}
    </button>
  )
}