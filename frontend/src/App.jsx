import { useCallback, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import LanguageSwitcher from './components/LanguageSwitcher'
import RequireAuth from './components/RequireAuth'
import Splash from './components/Splash'
import BookingDetail from './pages/BookingDetail'
import BookingForm from './pages/BookingForm'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

// the intro plays when the app starts on the home page, once per start
function shouldShowSplash() {
  const onHome = window.location.pathname === '/'
  try {
    return onHome && sessionStorage.getItem('splashSeen') !== '1'
  } catch {
    return onHome
  }
}

export default function App() {
  const location = useLocation()
  const [showSplash, setShowSplash] = useState(shouldShowSplash)

  const finishSplash = useCallback(() => {
    try {
      sessionStorage.setItem('splashSeen', '1')
    } catch {
      // storage not available: ignore
    }
    setShowSplash(false)
  }, [])

  const background = location.pathname.startsWith('/account')
    ? 'app-bg bg-jamkaran'
    : 'app-bg bg-pattern'

  return (
    <AuthProvider>
      <div className={background} />
      <div className="page">
        <LanguageSwitcher />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/majlis/:id" element={<BookingDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/new"
            element={
              <RequireAuth>
                <BookingForm />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
      {showSplash && <Splash onDone={finishSplash} />}
    </AuthProvider>
  )
}