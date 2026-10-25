import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function RequireAuth({ children, allowForced = false }) {
  const { isLoggedIn, mustChangePassword } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  // after an admin reset, the user must choose a new password first
  if (mustChangePassword && !allowForced) {
    return <Navigate to="/change-password" replace />
  }
  return children
}