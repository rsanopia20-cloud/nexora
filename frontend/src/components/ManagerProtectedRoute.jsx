import { Navigate } from 'react-router-dom'
import { useManagerAuth } from '../context/ManagerAuthContext'
import '../pages/Auth.css'

export default function ManagerProtectedRoute({ children }) {
  const { isManager, loading } = useManagerAuth()

  if (loading) {
    return (
      <div className="auth-shell">
        <p className="auth-loading">Loading...</p>
      </div>
    )
  }

  if (!isManager) {
    return <Navigate to="/manager/login" replace />
  }

  return children
}
