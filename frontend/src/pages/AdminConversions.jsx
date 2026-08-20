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

export default function AdminConversions() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyUserId, setBusyUserId] = useState('')

  async function loadSummary() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/conversions/customers-summary')
      setRows(data.customers || [])
    } catch (err) {
      setError(err.message || 'Failed to load customer earnings')
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

    const ok = window.confirm(`Mark ${formatCurrency(amount)} as paid for ${row.name}?`)
    if (!ok) return

    setBusyUserId(String(row.userId))
    setError('')
    try {
      await apiRequest(`/api/admin/conversions/customers/${row.userId}/mark-paid`, {
        method: 'PUT',
      })
      await loadSummary()
    } catch (err) {
      setError(err.message || 'Failed to mark paid')
    } finally {
      setBusyUserId('')
    }
  }

  return (
    <AdminShell title="Customer Earnings">
      <div className="admin-page-intro">
        <h1>Customer earnings</h1>
        <p>See exactly how much each customer has earned, been paid, and is still pending.</p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/conversions/upload" className="admin-btn admin-btn-ghost">
          Upload Excel
        </Link>
        <Link to="/admin/conversions/unmatched" className="admin-btn admin-btn-ghost">
          Review Unmatched
        </Link>
      </div>

      {loading ? <p className="admin-loading">Loading earnings summary...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !rows.length ? (
        <p className="admin-empty">No payable records yet.</p>
      ) : null}

      {!loading && rows.length ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2 className="admin-section-title">Customers ({formatNumber(rows.length)})</h2>
            <p className="admin-section-note">Sorted by pending amount (highest first)</p>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Referral Code</th>
                  <th>Total Accounts</th>
                  <th>Total Earned</th>
                  <th>Total Paid</th>
                  <th>Total Pending</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={String(row.userId)}
                    onClick={() => navigate(`/admin/conversions/${row.userId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="admin-cell-name" data-label="Customer Name">
                      {row.name || '—'}
                    </td>
                    <td data-label="Phone">{row.phone || '—'}</td>
                    <td data-label="Referral Code">{row.referralCode || '—'}</td>
                    <td className="admin-num" data-label="Total Accounts">
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
                        disabled={Number(row.totalPending || 0) <= 0 || busyUserId === String(row.userId)}
                        onClick={(event) => markAllPaid(row, event)}
                      >
                        {busyUserId === String(row.userId) ? 'Updating...' : 'Mark All Paid'}
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
