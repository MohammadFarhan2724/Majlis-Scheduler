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