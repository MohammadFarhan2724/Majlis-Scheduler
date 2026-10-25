const KEY = 'theme'

// the saved choice, or the phone's own light/dark setting on the first visit
export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage not available: use the phone setting
  }
  const dark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  return dark ? 'dark' : 'light'
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // ignore
  }
}

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