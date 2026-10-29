import { useTranslation } from 'react-i18next'

export default function Loader() {
  const { t } = useTranslation()
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{t('pleaseWait')}</span>
    </div>
  )
}