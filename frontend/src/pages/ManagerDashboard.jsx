import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import BrandLogo from '../components/BrandLogo'
import ConfirmDialog from '../components/ConfirmDialog'
import { useManagerAuth } from '../context/ManagerAuthContext'
import './Admin.css'

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const { manager, logout } = useManagerAuth()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [earnings, setEarnings] = useState(null)
  const [earningsLoading, setEarningsLoading] = useState(true)
  const [earningsError, setEarningsError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadEarnings() {
      setEarningsLoading(true)
      setEarningsError('')
      try {
        const data = await apiRequest('/api/manager/earnings')
        if (!cancelled) setEarnings(data)
      } catch (err) {
        if (!cancelled) setEarningsError(err.message || 'Failed to load earnings')
      } finally {
        if (!cancelled) setEarningsLoading(false)
      }
    }
    loadEarnings()
    return () => {
      cancelled = true
    }
  }, [])

  async function confirmLogout() {
    setLogoutBusy(true)
    try {
      await logout()
      navigate('/?auth=manager', { replace: true })
    } finally {
      setLogoutBusy(false)
      setLogoutOpen(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <BrandLogo to="/manager" size="sm" className="admin-logo" />
          <span className="admin-title">Manager</span>
        </div>
        <nav className="admin-nav is-open" aria-label="Manager">
          <button type="button" className="admin-logout-btn" onClick={() => setLogoutOpen(true)}>
            Log out
          </button>
        </nav>
      </header>

      <main className="admin-main">
        <div className="admin-page-intro">
          <h1>Welcome, {manager?.fullName || 'Manager'}.</h1>
          <p>
            Share your Manager ID <strong>{manager?.managerId || '—'}</strong> with your users.
            When they claim earnings with your ID, your share appears below.
          </p>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2 className="admin-section-title">Account</h2>
          </div>
          <div className="admin-meta">
            <div className="admin-meta-card">
              <span>Manager ID</span>
              <strong>{manager?.managerId || '—'}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Name</span>
              <strong>{manager?.fullName || '—'}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Email</span>
              <strong>{manager?.email || '—'}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Mobile</span>
              <strong>{manager?.mobile || '—'}</strong>
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2 className="admin-section-title">My earnings</h2>
            <p className="admin-section-note">Your share from claims that used your Manager ID</p>
          </div>

          {earningsLoading ? <p className="admin-loading">Loading earnings...</p> : null}
          {earningsError ? <p className="admin-error">{earningsError}</p> : null}

          {!earningsLoading && !earningsError ? (
            <>
              <div className="admin-meta" style={{ marginBottom: '1rem' }}>
                <div className="admin-meta-card">
                  <span>Total earned</span>
                  <strong>{formatCurrency(earnings?.totalEarned)}</strong>
                </div>
                <div className="admin-meta-card">
                  <span>Total paid</span>
                  <strong>{formatCurrency(earnings?.totalPaid)}</strong>
                </div>
                <div className="admin-meta-card">
                  <span>Total pending</span>
                  <strong>{formatCurrency(earnings?.totalPending)}</strong>
                </div>
              </div>

              {!earnings?.records?.length ? (
                <p className="admin-empty">No earnings yet. Ask your users to claim with your Manager ID.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Link</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Claimed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.records.map((record) => (
                        <tr key={record.id}>
                          <td className="admin-cell-name" data-label="Account">
                            {record.clientName || 'Referred account'}
                            {record.clientCode ? (
                              <span className="admin-section-note"> · {record.clientCode}</span>
                            ) : null}
                          </td>
                          <td data-label="Link">{record.linkName || '—'}</td>
                          <td className="admin-num" data-label="Amount">
                            {formatCurrency(record.amount)}
                          </td>
                          <td data-label="Payment">
                            <span
                              className={`badge ${record.paidStatus ? 'badge-on' : 'badge-off'}`}
                            >
                              {record.paidStatus ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td data-label="Claimed">{formatDate(record.claimedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        message="Are you sure you want to log out of the manager panel?"
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
