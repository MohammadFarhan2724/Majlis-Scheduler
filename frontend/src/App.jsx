import { Route, Routes } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import LanguageSwitcher from './components/LanguageSwitcher'
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}