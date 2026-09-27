import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from './ConfirmDialog'

export default function LogoutButton({ className, children = 'Log out', onBeforeOpen }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function confirmLogout() {
    setBusy(true)
    try {
      await logout()
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          if (typeof onBeforeOpen === 'function') onBeforeOpen()
          setOpen(true)
        }}
      >
        {children}
      </button>
      <ConfirmDialog
        open={open}
        title="Log out?"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        busy={busy}
        onConfirm={confirmLogout}
        onCancel={() => {
          if (!busy) setOpen(false)
        }}
      />
    </>
  )
}
