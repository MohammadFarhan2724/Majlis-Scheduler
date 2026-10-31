import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <>
      <h1>{t('notFoundTitle')}</h1>
      <div className="info-box">{t('notFoundText')}</div>
      <Link className="btn-primary" to="/">
        {t('goHome')}
      </Link>
    </>
  )
}