import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

function formatCurrency(value) {
  return `₹${formatNumber(value)}`
}

export default function AdminManagerEarnings() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyManagerId, setBusyManagerId] = useState('')

  async function loadSummary() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/conversions/managers-summary')
      setRows(data.managers || [])
    } catch (err) {
      setError(err.message || 'Failed to load manager earnings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  async function markAllPaid(row, event) {
    event.stopPropagation()
    const amount = Number(row.totalPending || 0)
    if (amount <= 0) return

    const ok = window.confirm(
      `Mark ${formatCurrency(amount)} as paid for ${row.name} (${row.code})?`
    )
    if (!ok) return

    setBusyManagerId(String(row.managerId))
    setError('')
    try {
      await apiRequest(`/api/admin/conversions/managers/${row.managerId}/mark-paid`, {
        method: 'PUT',
      })
      await loadSummary()
    } catch (err) {
      setError(err.message || 'Failed to mark paid')
    } finally {
      setBusyManagerId('')
    }
  }

  return (
    <AdminShell title="Manager Earnings">
      <div className="admin-page-intro">
        <h1>Manager earnings</h1>
        <p>
          See how much each manager earned from user claims (30% share), and mark pending amounts
          as paid.
        </p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/conversions" className="admin-btn admin-btn-ghost">
          Customer Earnings
        </Link>
        <Link to="/admin/managers" className="admin-btn admin-btn-ghost">
          Manage Managers
        </Link>
      </div>

      {loading ? <p className="admin-loading">Loading manager earnings...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !rows.length ? (
        <p className="admin-empty">No manager earnings yet. Earnings appear when users claim with a Manager ID.</p>
      ) : null}

      {!loading && rows.length ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2 className="admin-section-title">Managers ({formatNumber(rows.length)})</h2>
            <p className="admin-section-note">Sorted by pending amount (highest first)</p>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Manager ID</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Claims</th>
                  <th>Total Earned</th>
                  <th>Total Paid</th>
                  <th>Total Pending</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={String(row.managerId)}
                    onClick={() => navigate(`/admin/manager-earnings/${row.managerId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="admin-cell-name" data-label="Manager">
                      {row.name || '—'}
                    </td>
                    <td data-label="Manager ID">{row.code || '—'}</td>
                    <td data-label="Phone">{row.phone || '—'}</td>
                    <td data-label="Status">
                      <span className={`badge ${row.active ? 'badge-on' : 'badge-off'}`}>
                        {row.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="admin-num" data-label="Claims">
                      {formatNumber(row.totalAccounts)}
                    </td>
                    <td className="admin-num" data-label="Total Earned">
                      {formatCurrency(row.totalEarned)}
                    </td>
                    <td className="admin-num" data-label="Total Paid">
                      {formatCurrency(row.totalPaid)}
                    </td>
                    <td className="admin-num" data-label="Total Pending">
                      {formatCurrency(row.totalPending)}
                    </td>
                    <td data-label="Actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn-ghost"
                        disabled={
                          Number(row.totalPending || 0) <= 0 ||
                          busyManagerId === String(row.managerId)
                        }
                        onClick={(event) => markAllPaid(row, event)}
                      >
                        {busyManagerId === String(row.managerId)
                          ? 'Updating...'
                          : 'Mark All Paid'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
