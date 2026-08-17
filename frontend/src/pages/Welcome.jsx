import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Welcome() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="auth-shell welcome-shell">
      <div className="welcome-box">
        <BrandLogo to="/" size="md" />
        <h1>Hi {user?.fullName}</h1>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  )
}
