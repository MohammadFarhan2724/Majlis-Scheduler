import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'

export default function App() {
  const { t } = useTranslation()

  return (
    <div className="page">
      <LanguageSwitcher />
      <h1>{t('appName')}</h1>
      <p>{t('tagline')}</p>
    </div>
  )
}