import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import ur from './locales/ur.json'

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
]

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem('language')
    if (LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {
    // storage not available: use the default
  }
  return 'en'
}

function applyLanguage(code) {
  const lang = LANGUAGES.find((l) => l.code === code) || LANGUAGES[0]
  document.documentElement.lang = lang.code
  document.documentElement.dir = lang.dir // this flips the whole layout for Urdu
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ur: { translation: ur },
  },
  lng: readSavedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

applyLanguage(i18n.language)
i18n.on('languageChanged', (code) => {
  applyLanguage(code)
  try {
    localStorage.setItem('language', code)
  } catch {
    // ignore
  }
})

export default i18n