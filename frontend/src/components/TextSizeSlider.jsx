import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyFontScale, getFontScale, saveFontScale } from '../theme'

export default function TextSizeSlider() {
  const { t } = useTranslation()
  const [scale, setScale] = useState(() => getFontScale())

  function change(e) {
    const value = Number(e.target.value)
    setScale(value)
    applyFontScale(value)
    saveFontScale(value)
  }

  return (
    <div className="size-control">
      <span className="size-a small" aria-hidden="true">
        A
      </span>
      <input
        type="range"
        min="85"
        max="150"
        step="5"
        value={scale}
        onChange={change}
        aria-label={t('textSize')}
      />
      <span className="size-a big" aria-hidden="true">
        A
      </span>
    </div>
  )
}