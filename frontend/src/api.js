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

const KNOWN_ERRORS = [
  ['already taken', 'err_spot_taken'],
  ['already full', 'err_day_full'],
  ['in the past', 'err_past_date'],
  ['write the type', 'err_write_type'],
  ['select a venue', 'err_venue_needed'],
  ['at least one name', 'err_name_needed'],
  ['Invalid category', 'err_bad_category'],
  ['too big', 'err_image_big'],
  ['valid JPG', 'err_image_bad'],
  ['throttled', 'err_throttled'],
  ['Wrong mobile number', 'err_wrong_login'],
  ['valid 10-digit', 'err_bad_mobile'],
  ['already registered', 'err_mobile_taken'],
  ['too short', 'err_pw_short'],
  ['too common', 'err_pw_common'],
  ['entirely numeric', 'err_pw_numeric'],
  ['required', 'err_required'],
]

export function translateError(err, t) {
  const text = errorText(err, '')
  const hit = KNOWN_ERRORS.find(([part]) => text.includes(part))
  return hit ? t(hit[1]) : t('errorGeneric')
}
// use only the path, so pictures also load on a phone through the dev proxy
export function mediaPath(url) {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}