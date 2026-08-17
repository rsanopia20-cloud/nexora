import { useAdminAuth } from '../context/AdminAuthContext'
import AdminLogin from '../pages/AdminLogin'
import '../pages/Auth.css'

export default function AdminProtectedRoute({ children }) {
  const { isAdmin, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="auth-shell">
        <p className="auth-loading">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return <AdminLogin />
  }

  return children
}
