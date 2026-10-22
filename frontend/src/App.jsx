import { Route, Routes } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import LanguageSwitcher from './components/LanguageSwitcher'
import RequireAuth from './components/RequireAuth'
import BookingDetail from './pages/BookingDetail'
import BookingForm from './pages/BookingForm'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}