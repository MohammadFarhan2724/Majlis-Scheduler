import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getToken, saveToken } from '../api'
import { AuthContext } from './AuthContext'

const FLAG_KEY = 'mustChange'

function readFlag() {
  try {
    return localStorage.getItem(FLAG_KEY) === '1'
  } catch {
    return false
  }
}

function writeFlag(on) {
  try {
    if (on) localStorage.setItem(FLAG_KEY, '1')
    else localStorage.removeItem(FLAG_KEY)
  } catch {
    // storage not available: ignore
  }
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken())
  const [mustChangePassword, setMustChangePassword] = useState(readFlag)

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
    const flag = Boolean(data.must_change_password)
    saveToken(data.token)
    setToken(data.token)
    setMustChangePassword(flag)
    writeFlag(flag)
  }, [])

  const register = useCallback(async (name, mobile, password) => {
    const data = await api('/register/', {
      method: 'POST',
      body: { name, mobile, password },
    })
    saveToken(data.token)
    setToken(data.token)
    setMustChangePassword(false)
    writeFlag(false)
  }, [])

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    const data = await api('/change-password/', {
      method: 'POST',
      body: { old_password: oldPassword, new_password: newPassword },
    })
    // the server gives a new token after a password change
    saveToken(data.token)
    setToken(data.token)
    setMustChangePassword(false)
    writeFlag(false)
  }, [])

  const logout = useCallback(() => {
    saveToken(null)
    setToken(null)
    setMustChangePassword(false)
    writeFlag(false)
  }, [])

  const value = useMemo(
    () => ({
      token,
      isLoggedIn: Boolean(token),
      mustChangePassword,
      login,
      register,
      changePassword,
      logout,
    }),
    [token, mustChangePassword, login, register, changePassword, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}