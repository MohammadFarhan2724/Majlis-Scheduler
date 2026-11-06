const KEY = 'theme' // 'light', 'dark' or 'system'

export function getThemeChoice() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    // storage not available: follow the phone
  }
  return 'system'
}

function systemTheme() {
  const dark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  return dark ? 'dark' : 'light'
}

export function applyTheme(choice) {
  document.documentElement.dataset.theme =
    choice === 'system' ? systemTheme() : choice
}

export function saveTheme(choice) {
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    // ignore
  }
}

// when the choice is "system", follow the phone if its setting changes
export function watchSystemTheme(getChoice) {
  if (!window.matchMedia) return () => {}
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (getChoice() === 'system') applyTheme('system')
  }
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

// ---------- text size ----------
const SCALE_KEY = 'fontScale'

// text size in percent: 85 to 150, normal is 100
export function getFontScale() {
  try {
    const saved = Number(localStorage.getItem(SCALE_KEY))
    if (saved >= 85 && saved <= 150) return saved
  } catch {
    // storage not available: use the normal size
  }
  return 100
}

export function applyFontScale(percent) {
  document.documentElement.style.setProperty('--font-scale', String(percent / 100))
}

export function saveFontScale(percent) {
  try {
    localStorage.setItem(SCALE_KEY, String(percent))
  } catch {
    // ignore
  }
}