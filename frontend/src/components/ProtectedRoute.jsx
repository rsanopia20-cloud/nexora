import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../pages/Auth.css'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-shell">
        <p className="auth-loading">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/?auth=login" replace state={{ from: location }} />
  }

  return children
}
