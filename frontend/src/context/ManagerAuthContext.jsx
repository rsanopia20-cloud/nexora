import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  apiRequest,
  clearManagerToken,
  getManagerToken,
  setManagerToken,
} from '../api/client'

const ManagerAuthContext = createContext(null)

export function ManagerAuthProvider({ children }) {
  const [manager, setManager] = useState(null)
  const [loading, setLoading] = useState(true)

  const hydrate = useCallback(async () => {
    const token = getManagerToken()
    if (!token) {
      setManager(null)
      setLoading(false)
      return
    }

    try {
      const data = await apiRequest('/api/manager/me')
      setManager(data.manager || null)
    } catch {
      clearManagerToken()
      setManager(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const login = useCallback(async (payload) => {
    const data = await apiRequest('/api/manager/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setManagerToken(data.token)
    setManager(data.manager || null)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/manager/logout', { method: 'POST' })
    } catch {
      // clear local session even if network fails
    }
    clearManagerToken()
    setManager(null)
  }, [])

  const value = useMemo(
    () => ({
      manager,
      isManager: Boolean(manager),
      loading,
      login,
      logout,
    }),
    [manager, loading, login, logout]
  )

  return (
    <ManagerAuthContext.Provider value={value}>{children}</ManagerAuthContext.Provider>
  )
}

export function useManagerAuth() {
  const context = useContext(ManagerAuthContext)
  if (!context) {
    throw new Error('useManagerAuth must be used within ManagerAuthProvider')
  }
  return context
}
