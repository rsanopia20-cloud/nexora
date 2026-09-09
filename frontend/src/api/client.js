const TOKEN_KEY = 'nexora_token'
const ADMIN_TOKEN_KEY = 'nexora_admin_token'
const MANAGER_TOKEN_KEY = 'nexora_manager_token'

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

export function getManagerToken() {
  return localStorage.getItem(MANAGER_TOKEN_KEY)
}

export function setManagerToken(token) {
  localStorage.setItem(MANAGER_TOKEN_KEY, token)
}

export function clearManagerToken() {
  localStorage.removeItem(MANAGER_TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const isAdminApi = path.startsWith('/api/admin')
  const isManagerApi = path.startsWith('/api/manager')
  const token = isAdminApi
    ? getAdminToken()
    : isManagerApi
      ? getManagerToken()
      : getToken()
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

/**
 * Download a binary file from an admin API path (e.g. Excel export).
 */
export async function downloadAdminFile(path, fallbackFileName = 'download.xlsx') {
  const token = getAdminToken()
  const url = `${API_BASE}${path}`

  let response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
  } catch {
    throw new Error(
      'Cannot reach the server. Check that the API is running and VITE_API_URL is set for production.'
    )
  }

  if (!response.ok) {
    let message = `Download failed (${response.status})`
    try {
      const data = await response.json()
      if (data?.message) message = data.message
    } catch {
      // keep fallback
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition') || ''
  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
  const fileName = fileNameMatch?.[1] || fallbackFileName

  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(objectUrl)
}

