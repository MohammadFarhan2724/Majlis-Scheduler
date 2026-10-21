const TOKEN_KEY = 'token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage not available: ignore
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Token ${token}`

  const isForm = body instanceof FormData
  if (body && !isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // some replies (like delete) have no body
  }

  if (res.status === 401 && token) {
    // the saved token is no longer valid
    saveToken(null)
    window.dispatchEvent(new Event('auth-expired'))
  }

  if (!res.ok) {
    const err = new Error('Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

// Picks the first readable error message from a backend reply
export function errorText(err, fallback) {
  const data = err && err.data
  if (!data) return fallback
  if (typeof data.detail === 'string') return data.detail
  const first = Object.values(data).flat()[0]
  return typeof first === 'string' ? first : fallback
}