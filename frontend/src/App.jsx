import { useCallback, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import LanguageSwitcher from './components/LanguageSwitcher'
import RequireAuth from './components/RequireAuth'
import Splash from './components/Splash'
import TextSizeSlider from './components/TextSizeSlider'
import ThemeToggle from './components/ThemeToggle'
import Account from './pages/Account'
import BookingDetail from './pages/BookingDetail'
import BookingForm from './pages/BookingForm'
import ChangePassword from './pages/ChangePassword'
import ForgotPassword from './pages/ForgotPassword'
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

  const onAccount = location.pathname.startsWith('/account')

  return (
    <AuthProvider>
      <div className={onAccount ? 'app-bg bg-jamkaran' : 'app-bg bg-pattern'} />
      {!showSplash && (
        <div className={onAccount ? 'page page-account' : 'page'}>
          <div className="top-bar">
            <LanguageSwitcher />
            <div className="top-row">
              <TextSizeSlider />
              <ThemeToggle />
            </div>
          </div>
          <div key={location.pathname} className="route-fade">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/majlis/:id" element={<BookingDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/change-password"
                element={
                  <RequireAuth allowForced>
                    <ChangePassword />
                  </RequireAuth>
                }
              />
              <Route
                path="/new"
                element={
                  <RequireAuth>
                    <BookingForm />
                  </RequireAuth>
                }
              />
              <Route
                path="/edit/:id"
                element={
                  <RequireAuth>
                    <BookingForm />
                  </RequireAuth>
                }
              />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Account />
                  </RequireAuth>
                }
              />
            </Routes>
          </div>
        </div>
      )}
      {showSplash && <Splash onDone={finishSplash} />}
    </AuthProvider>
  )
}