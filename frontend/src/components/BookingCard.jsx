import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { mediaPath } from '../api'
import { formatDateShort } from '../dates'

export default function BookingCard({ booking: b, footer }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const months = t('hijriMonths', { returnObjects: true })
  const h = b.hijri_date

  const title =
    b.category === 'other' ? b.other_category : t(`${b.kind}_${b.category}`)
  const venue = b.venue_detail
    ? b.venue_detail[`name_${lang}`] || b.venue_detail.name_en
    : b.other_venue
  const time = t(`slot_${b.time_slot.replace(':', '')}`)

  return (
    <article className="card">
      <Link className="card-link" to={`/majlis/${b.id}`} state={{ booking: b }}>
        <div className="card-body">
          <img
            className="card-photo"
            src={mediaPath(b.parcha_thumb || b.parcha)}
            alt=""
            loading="lazy"
          />
          <div className="card-text">
            <div className="card-text-inner">
              <div className="card-type" dir="auto">
                {title}
              </div>
              <div className="card-date">{formatDateShort(b.date, lang)}</div>
              <div className="card-hijri">
                {h.day} {months[h.month - 1]} {h.year}
              </div>
              <div className="card-time">{time}</div>
              <div className="line">
                <span className="label">{t('khitabatShort')}:</span>{' '}
                <span dir="auto">{b.khitabat}</span>
              </div>
              <div className="line">
                <span className="label">{t('venue')}:</span>{' '}
                <span dir="auto">{venue}</span>
              </div>
              {b.sogwaran ? (
                <div className="line">
                  <span className="label">{t('sogwaran')}:</span>{' '}
                  <span dir="auto">{b.sogwaran}</span>
                </div>
              ) : (
                <div className="line">
                  <span className="label">{t('organizerShort')}:</span>{' '}
                  <span dir="auto">{b.organizer_name}</span>
                </div>
              )}
              {b.after_majlis && (
                <div className="line">
                  <span className="label">{t('afterMajlis')}:</span>{' '}
                  <span dir="auto">{b.after_majlis}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="card-note">{t('defaultNote')}</p>
      </Link>
      {footer}
    </article>
  )
}