const TOKEN_KEY = 'nexora_token'
const ADMIN_TOKEN_KEY = 'nexora_admin_token'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const isAdminApi = path.startsWith('/api/admin')
  const token = isAdminApi ? getAdminToken() : getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const url = `${API_BASE}${path}`

  let response
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new Error(
      'Cannot reach the server. Check that the API is running and VITE_API_URL is set for production.'
    )
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`)
    error.status = response.status
    error.errors = data?.errors || []
    throw error
  }

  return data
}
