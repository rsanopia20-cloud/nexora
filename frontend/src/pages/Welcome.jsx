import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Welcome() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)

  async function confirmLogout() {
    setLogoutBusy(true)
    try {
      await logout()
      navigate('/', { replace: true })
    } finally {
      setLogoutBusy(false)
      setLogoutOpen(false)
    }
  }

  return (
    <div className="auth-shell welcome-shell">
      <div className="welcome-box">
        <BrandLogo to="/" size="md" />
        <h1>Hi {user?.fullName}</h1>
        <button type="button" className="btn btn-ghost" onClick={() => setLogoutOpen(true)}>
          Log out
        </button>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        busy={logoutBusy}
        onConfirm={confirmLogout}
        onCancel={() => {
          if (!logoutBusy) setLogoutOpen(false)
        }}
      />
    </div>
  )
}
