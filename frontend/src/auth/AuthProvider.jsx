import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getToken, saveToken } from '../api'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken())
  const [mustChangePassword, setMustChangePassword] = useState(false)

  useEffect(() => {
    const onExpired = () => setToken(null)
    window.addEventListener('auth-expired', onExpired)
    return () => window.removeEventListener('auth-expired', onExpired)
  }, [])

  const login = useCallback(async (mobile, password) => {
    const data = await api('/login/', {
      method: 'POST',
      body: { mobile, password },
    })
    saveToken(data.token)
    setToken(data.token)
    setMustChangePassword(Boolean(data.must_change_password))
  }, [])

  const register = useCallback(async (mobile, password) => {
    const data = await api('/register/', {
      method: 'POST',
      body: { mobile, password },
    })
    saveToken(data.token)
    setToken(data.token)
    setMustChangePassword(false)
  }, [])

  const logout = useCallback(() => {
    saveToken(null)
    setToken(null)
    setMustChangePassword(false)
  }, [])

  const value = useMemo(
    () => ({
      token,
      isLoggedIn: Boolean(token),
      mustChangePassword,
      login,
      register,
      logout,
    }),
    [token, mustChangePassword, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}