import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import './index.css'
import { applyFontScale, applyTheme, getFontScale, getTheme } from './theme'
import App from './App.jsx'

// before the first screen is drawn, so there is no flash
applyTheme(getTheme())
applyFontScale(getFontScale())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)