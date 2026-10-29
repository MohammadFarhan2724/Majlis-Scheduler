import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { todayString } from '../dates'
import { EMPTY_FILTERS, hasFilters } from '../filters'
import DatePicker from './DatePicker'

const WHEN_CHIPS = [
  ['', 'whenAny'],
  ['today', 'whenToday'],
  ['tomorrow', 'whenTomorrow'],
  ['week', 'whenWeek'],
  ['date', 'whenPick'],
]

export default function FilterBar({ filters, onChange, options, shown, total }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const lang = i18n.language

  function set(patch) {
    onChange({ ...filters, ...patch })
  }

  const activeCount = [filters.type, filters.venue, filters.when].filter(
    Boolean,
  ).length

  function typeLabel(kind, code) {
    return code === 'other' ? t('other') : t(`${kind}_${code}`)
  }

  function venueName(v) {
    return v[`name_${lang}`] || v.name_en
  }

  return (
    <div className="filters">
      <div className="filter-row">
        <input
          type="search"
          className="search-input"
          dir="auto"
          enterKeyHint="search"
          placeholder={t('searchPlaceholder')}
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
        />
        <button
          type="button"
          className="btn-secondary small"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {t('filters')}
          {activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>

      {open && (
        <div className="filter-panel">
          <label>{t('date')}</label>
          <div className="chips">
            {WHEN_CHIPS.map(([value, label]) => (
              <button
                type="button"
                key={label}
                className={filters.when === value ? 'chip active' : 'chip'}
                onClick={() =>
                  set({ when: value, date: value === 'date' ? filters.date : '' })
                }
              >
                {t(label)}
              </button>
            ))}
          </div>
          {filters.when === 'date' && (
            <DatePicker
              mode="filter"
              value={filters.date}
              onChange={(d) => set({ date: d })}
              today={todayString()}
            />
          )}

          {options && (
            <>
              <label htmlFor="f-type">{t('filterType')}</label>
              <select
                id="f-type"
                value={filters.type}
                onChange={(e) => set({ type: e.target.value })}
              >
                <option value="">{t('allTypes')}</option>
                {['majlis', 'mehfil'].map((kind) => (
                  <optgroup
                    key={kind}
                    label={kind === 'majlis' ? t('kindMajlis') : t('kindMehfil')}
                  >
                    <option value={`kind:${kind}`}>
                      {kind === 'majlis' ? t('allMajlis') : t('allMehfil')}
                    </option>
                    {(options[`${kind}_types`] || []).map((x) => (
                      <option key={x.code} value={`cat:${kind}:${x.code}`}>
                        {typeLabel(kind, x.code)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <label htmlFor="f-venue">{t('venue')}</label>
              <select
                id="f-venue"
                value={filters.venue}
                onChange={(e) => set({ venue: e.target.value })}
              >
                <option value="">{t('allVenues')}</option>
                {options.venues.map((v) => (
                  <option key={v.id} value={String(v.id)}>
                    {venueName(v)}
                  </option>
                ))}
                <option value="other">{t('other')}</option>
              </select>
            </>
          )}
        </div>
      )}

      {hasFilters(filters) && (
        <div className="result-line">
          <span>{t('showingCount', { shown, total })}</span>
          <button
            type="button"
            className="link-btn"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            {t('clearFilters')}
          </button>
        </div>
      )}
    </div>
  )
}