const KEY = 'mutawalliToken'

export function getMutawalliToken() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveMutawalliToken(token) {
  try {
    if (token) localStorage.setItem(KEY, token)
    else localStorage.removeItem(KEY)
  } catch {
    // storage not available: ignore
  }
}

// Login sends no old token, so a stale token cannot block it
export async function mutawalliLogin(username, password) {
  const res = await fetch('/api/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: username, password }),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    // no body
  }
  if (!res.ok) {
    const err = new Error('Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export async function mutawalliApi(path) {
  const token = getMutawalliToken()
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    // no body
  }
  if (res.status === 401 || res.status === 403) saveMutawalliToken(null)
  if (!res.ok) {
    const err = new Error('Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}