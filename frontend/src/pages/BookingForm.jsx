import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, mediaPath, translateError } from '../api'
import {
  cachedOptions,
  loadCalendar,
  loadOptions,
  refreshBookings,
} from '../prefetch'
import DatePicker from '../components/DatePicker'
import Loader from '../components/Loader'

const PERIODS = ['morning', 'afternoon', 'evening']

function todayString() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
      {error && (
        <div className="field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

export default function BookingForm() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)

    const [options, setOptions] = useState(() => cachedOptions())
  const [loadFailed, setLoadFailed] = useState(false)
  const [calendars, setCalendars] = useState({})
  const [original, setOriginal] = useState(null)
  const [notMine, setNotMine] = useState(false)

  const [kind, setKind] = useState('majlis')
  const [category, setCategory] = useState('')
  const [otherCategory, setOtherCategory] = useState('')
  const [organizer, setOrganizer] = useState('')
  const [isaal, setIsaal] = useState(false)
  const [names, setNames] = useState([''])
  const [sogwaran, setSogwaran] = useState('')
  const [khitabat, setKhitabat] = useState('')
  const [venue, setVenue] = useState('')
  const [otherVenue, setOtherVenue] = useState('')
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [image, setImage] = useState(null)
  const [afterMajlis, setAfterMajlis] = useState('')

  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  // lists (majlis types, venues, time slots) come from the backend
  useEffect(() => {
    loadOptions()
      .then(setOptions)
      .catch(() => setLoadFailed(true))
  }, [])

  // in edit mode: load the saved booking and fill the form
  useEffect(() => {
    if (!id) return undefined
    let cancelled = false
    api(`/bookings/${id}/`)
      .then((b) => {
        if (cancelled) return
        if (!b.is_mine) {
          setNotMine(true)
          return
        }
        setOriginal(b)
        setKind(b.kind)
        setCategory(b.category)
        setOtherCategory(b.other_category)
        setOrganizer(b.organizer_name)
        setIsaal(b.isaal_e_sawaab)
        setNames(b.marhoomeen.length ? b.marhoomeen : [''])
        setSogwaran(b.sogwaran)
        setKhitabat(b.khitabat)
        setVenue(b.venue ? String(b.venue) : 'other')
        setOtherVenue(b.other_venue)
        setDate(b.date)
        setTimeSlot(b.time_slot)
        setAfterMajlis(b.after_majlis)
      })
      .catch(() => {
        if (!cancelled) setNotMine(true)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // when a date is chosen, load that month: Islamic dates and booked parts of the day
  useEffect(() => {
    if (!date) return undefined
    const key = date.slice(0, 7)
    if (calendars[key]) return undefined
    const [year, month] = date.split('-')
    let cancelled = false
    loadCalendar(Number(year), Number(month))
      .then((days) => {
        if (!cancelled) setCalendars((old) => ({ ...old, [key]: days }))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [date, calendars])

  const preview = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image],
  )
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  const lang = i18n.language
  const months = t('hijriMonths', { returnObjects: true })
  const withIsaal = kind === 'majlis' && isaal
  const dayInfo = date
    ? calendars[date.slice(0, 7)]?.find((d) => d.date === date)
    : null

  // when editing, the booking's own spot on its own day is not "taken"
  const onOriginalDay = Boolean(original && date === original.date)
  const rawTaken = dayInfo ? dayInfo.taken : []
  const takenPeriods = onOriginalDay
    ? rawTaken.filter((p) => p !== original.period)
    : rawTaken
  const dayFull = Boolean(dayInfo && dayInfo.full && !onOriginalDay)

  const typeList = options
    ? kind === 'majlis'
      ? options.majlis_types
      : options.mehfil_types
    : []

  const slotsByPeriod = options
    ? PERIODS.map((period) => ({
        period,
        slots: options.time_slots.filter((s) => s.period === period),
      }))
    : []

  function venueName(v) {
    return v[`name_${lang}`] || v.name_en
  }

  function chooseKind(next) {
    setKind(next)
    setCategory('')
    setOtherCategory('')
    if (next === 'mehfil') setIsaal(false)
  }

  function validate() {
    const e = {}
    const need = t('err_required')
    if (!category) e.category = need
    else if (category === 'other' && !otherCategory.trim())
      e.otherCategory = need
    if (withIsaal) {
      if (!names.some((n) => n.trim())) e.names = t('err_need_name')
      if (!sogwaran.trim()) e.sogwaran = need
    } else if (!organizer.trim()) {
      e.organizer = need
    }
    if (!khitabat.trim()) e.khitabat = need
    if (venue === '') e.venue = need
    else if (venue === 'other' && !otherVenue.trim()) e.otherVenue = need
    if (!date) e.date = need
    else if (date < todayString() && !onOriginalDay) e.date = t('err_past_date')
    if (!timeSlot) {
      e.timeSlot = t('err_pick_time')
    } else {
      const period = options.time_slots.find((s) => s.code === timeSlot)?.period
      if (dayFull) e.timeSlot = t('err_day_full')
      else if (takenPeriods.includes(period)) e.timeSlot = t('err_spot_taken')
    }
    if (!image && !editing) e.image = t('err_need_image')
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setFormError('')
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError(t('err_fix_form'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const body = new FormData()
    body.append('kind', kind)
    body.append('category', category)
    body.append('other_category', category === 'other' ? otherCategory.trim() : '')
    body.append('organizer_name', withIsaal ? '' : organizer.trim())
    body.append('sogwaran', withIsaal ? sogwaran.trim() : '')
    body.append('khitabat', khitabat.trim())
    body.append('venue', venue === 'other' ? '' : venue)
    body.append('other_venue', venue === 'other' ? otherVenue.trim() : '')
    body.append('date', date)
    body.append('time_slot', timeSlot)
    if (image) body.append('parcha', image)
    body.append('isaal_e_sawaab', withIsaal ? 'true' : 'false')
    if (withIsaal) {
      names
        .map((n) => n.trim())
        .filter(Boolean)
        .forEach((n) => body.append('marhoomeen_names', n))
    }
    body.append('after_majlis', afterMajlis.trim())

    setBusy(true)
    try {
      await api(editing ? `/bookings/${id}/` : '/bookings/', {
        method: editing ? 'PATCH' : 'POST',
        body,
      })
      await refreshBookings() // so the home list shows the change
      navigate(editing ? '/account' : '/', { state: { saved: true } })
    } catch (err) {
      setFormError(translateError(err, t))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setBusy(false)
    }
  }

  if (notMine) return <div className="error-box">{t('notFound')}</div>
  if (loadFailed) return <div className="error-box">{t('errorGeneric')}</div>
  if (!options || (editing && !original)) return <Loader />

  const shownImage = preview || (original ? mediaPath(original.parcha) : null)

  return (
    <>
      <Link className="back-link" to={editing ? '/account' : '/'}>
        {t('back')}
      </Link>
      <h1>{editing ? t('editTitle') : t('newTitle')}</h1>

      {formError && (
        <div className="error-box" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label>{t('kindLabel')}</label>
          <div className="toggle-row">
            <button
              type="button"
              className={kind === 'majlis' ? 'lang-btn active' : 'lang-btn'}
              onClick={() => chooseKind('majlis')}
            >
              {t('kindMajlis')}
            </button>
            <button
              type="button"
              className={kind === 'mehfil' ? 'lang-btn active' : 'lang-btn'}
              onClick={() => chooseKind('mehfil')}
            >
              {t('kindMehfil')}
            </button>
          </div>
        </div>

        <Field
          id="category"
          label={kind === 'majlis' ? t('categoryMajlis') : t('categoryMehfil')}
          error={errors.category || errors.otherCategory}
        >
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t('choose')}</option>
            {typeList
              .filter((x) => x.code !== 'other')
              .map((x) => (
                <option key={x.code} value={x.code}>
                  {t(`${kind}_${x.code}`)}
                </option>
              ))}
            <option value="other">{t('other')}</option>
          </select>
          {category === 'other' && (
            <input
              dir="auto"
              type="text"
              maxLength={100}
              placeholder={t('writeType')}
              value={otherCategory}
              onChange={(e) => setOtherCategory(e.target.value)}
            />
          )}
        </Field>

        {kind === 'majlis' && (
          <label className="check-row">
            <input
              type="checkbox"
              checked={isaal}
              onChange={(e) => setIsaal(e.target.checked)}
            />
            {t('isaal')}
          </label>
        )}

        {withIsaal ? (
          <>
            <div className="names-block">
              {names.map((n, i) => (
                <div className="name-row" key={i}>
                  <input
                    dir="auto"
                    type="text"
                    maxLength={200}
                    placeholder={t('marhoomName')}
                    value={n}
                    onChange={(e) =>
                      setNames(
                        names.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                  />
                  {i > 0 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => setNames(names.filter((_, j) => j !== i))}
                    >
                      {t('remove')}
                    </button>
                  )}
                </div>
              ))}
              {errors.names && (
                <div className="field-error" role="alert">
                  {errors.names}
                </div>
              )}
              <button
                type="button"
                className="btn-secondary small"
                onClick={() => setNames([...names, ''])}
              >
                {t('addMore')}
              </button>
            </div>

            <Field
              id="sogwaran"
              label={t('sogwaran')}
              hint={t('sogwaranHelp')}
              error={errors.sogwaran}
            >
              <textarea
                id="sogwaran"
                dir="auto"
                maxLength={500}
                value={sogwaran}
                onChange={(e) => setSogwaran(e.target.value)}
              />
            </Field>
          </>
        ) : (
          <Field id="organizer" label={t('organizer')} error={errors.organizer}>
            <input
              id="organizer"
              dir="auto"
              type="text"
              maxLength={100}
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
            />
          </Field>
        )}

        <Field id="khitabat" label={t('khitabat')} error={errors.khitabat}>
          <input
            id="khitabat"
            dir="auto"
            type="text"
            maxLength={100}
            value={khitabat}
            onChange={(e) => setKhitabat(e.target.value)}
          />
        </Field>

        <Field
          id="venue"
          label={t('venue')}
          error={errors.venue || errors.otherVenue}
        >
          <select
            id="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          >
            <option value="">{t('choose')}</option>
            {options.venues.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {venueName(v)}
              </option>
            ))}
            <option value="other">{t('other')}</option>
          </select>
          {venue === 'other' && (
            <input
              dir="auto"
              type="text"
              maxLength={150}
              placeholder={t('writeVenue')}
              value={otherVenue}
              onChange={(e) => setOtherVenue(e.target.value)}
            />
          )}
        </Field>

        <Field id="date" label={t('date')} error={errors.date}>
            <DatePicker
            value={date}
            onChange={setDate}
            today={todayString()}
            ownDate={original ? original.date : null}
          />
          {dayInfo && (
            <div className="islamic-date">
              {t('islamicDate')}: {dayInfo.hijri.day}{' '}
              {months[dayInfo.hijri.month - 1]} {dayInfo.hijri.year}
            </div>
          )}
        </Field>

        <div className="field">
          <label>{t('time')}</label>
          {!date && <div className="hint">{t('chooseDateFirst')}</div>}
          {dayFull && <div className="field-error">{t('dayFull')}</div>}
          {slotsByPeriod.map(({ period, slots }) => {
            const taken = takenPeriods.includes(period) || dayFull
            return (
              <div className="period-group" key={period}>
                <div className="period-title">
                  {t(`period_${period}`)}
                  {date && taken && (
                    <span className="taken-note"> – {t('periodTaken')}</span>
                  )}
                </div>
                <div className="slots">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.code}
                      className={
                        'slot-btn' +
                        (timeSlot === s.code ? ' selected' : '') +
                        (s.code.startsWith('after') ? ' wide' : '')
                      }
                      disabled={!date || taken}
                      aria-pressed={timeSlot === s.code}
                      onClick={() => setTimeSlot(s.code)}
                    >
                      {t(`slot_${s.code.replace(':', '')}`)}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {errors.timeSlot && (
            <div className="field-error" role="alert">
              {errors.timeSlot}
            </div>
          )}
        </div>

        <Field
          id="parcha"
          label={t('parcha')}
          hint={editing ? t('keepPhotoHelp') : undefined}
          error={errors.image}
        >
          <label className="btn-secondary file-btn">
            {shownImage ? t('changeImage') : t('chooseImage')}
            <input
              id="parcha"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0] || null)}
            />
          </label>
          {shownImage && <img className="preview" src={shownImage} alt="" />}
        </Field>

        <Field
          id="after"
          label={t('afterMajlis')}
          hint={t('afterMajlisHelp')}
        >
          <textarea
            id="after"
            dir="auto"
            maxLength={500}
            value={afterMajlis}
            onChange={(e) => setAfterMajlis(e.target.value)}
          />
        </Field>

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? t('pleaseWait') : editing ? t('saveChanges') : t('submit')}
        </button>
      </form>
    </>
  )
}