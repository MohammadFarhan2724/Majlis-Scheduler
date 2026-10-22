import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}