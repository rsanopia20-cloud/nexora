import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  apiRequest,
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from '../api/client'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const hydrate = useCallback(async () => {
    const token = getAdminToken()
    if (!token) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    try {
      await apiRequest('/api/admin/me')
      setIsAdmin(true)
    } catch {
      clearAdminToken()
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const login = useCallback(async (payload) => {
    const data = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setAdminToken(data.token)
    setIsAdmin(true)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/admin/logout', { method: 'POST' })
    } catch {
      // clear local session even if network fails
    }
    clearAdminToken()
    setIsAdmin(false)
  }, [])

  const value = useMemo(
    () => ({
      isAdmin,
      loading,
      login,
      logout,
    }),
    [isAdmin, loading, login, logout]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
