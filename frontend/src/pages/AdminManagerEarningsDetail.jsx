import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

function formatCurrency(value) {
  return `₹${formatNumber(value)}`
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

export default function AdminManagerEarningsDetail() {
  const { managerId } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingPaid, setMarkingPaid] = useState(false)

  async function loadDetail() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest(`/api/admin/conversions/managers/${managerId}`)
      setDetail(data)
    } catch (err) {
      setError(err.message || 'Failed to load manager earnings detail')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerId])

  async function handleMarkPaid() {
    const pending = Number(detail?.totalPending || 0)
    if (pending <= 0) return
    const name = detail?.manager?.name || 'this manager'
    const ok = window.confirm(`Mark ${formatCurrency(pending)} as paid for ${name}?`)
    if (!ok) return

    setMarkingPaid(true)
    setError('')
    try {
      await apiRequest(`/api/admin/conversions/managers/${managerId}/mark-paid`, {
        method: 'PUT',
      })
      await loadDetail()
    } catch (err) {
      setError(err.message || 'Failed to mark as paid')
    } finally {
      setMarkingPaid(false)
    }
  }

  return (
    <AdminShell title="Manager Earnings Detail">
      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/manager-earnings" className="admin-btn admin-btn-ghost">
          ← Back to manager earnings
        </Link>
        {!loading && detail ? (
          <button
            type="button"
            className="admin-btn"
            disabled={Number(detail.totalPending || 0) <= 0 || markingPaid}
            onClick={handleMarkPaid}
          >
            {markingPaid
              ? 'Updating...'
              : `Mark Pending ${formatCurrency(detail.totalPending)} Paid`}
          </button>
        ) : null}
      </div>

      {loading ? <p className="admin-loading">Loading manager details...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error && detail ? (
        <>
          <div className="admin-detail-head">
            <h1>{detail.manager?.name || 'Unknown manager'}</h1>
            <p>
              Manager ID: <strong>{detail.manager?.managerId || '—'}</strong>
              {detail.manager?.phone ? ` · ${detail.manager.phone}` : ''}
              {detail.manager?.email ? ` · ${detail.manager.email}` : ''}
              {' · '}
              <span className={`badge ${detail.manager?.active ? 'badge-on' : 'badge-off'}`}>
                {detail.manager?.active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>

          <div className="admin-meta">
            <div className="admin-meta-card">
              <span>Total earned (30%)</span>
              <strong>{formatCurrency(detail.totalEarned)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Total paid</span>
              <strong>{formatCurrency(detail.totalPaid)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Total pending</span>
              <strong>{formatCurrency(detail.totalPending)}</strong>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2 className="admin-section-title">By link</h2>
            </div>
            {!detail.byLink?.length ? (
              <p className="admin-empty">No earnings for this manager yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Link</th>
                      <th>Claims</th>
                      <th>Earned</th>
                      <th>Paid</th>
                      <th>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.byLink.map((row) => (
                      <tr key={String(row.linkId)}>
                        <td className="admin-cell-name" data-label="Link">
                          {row.linkName}
                        </td>
                        <td className="admin-num" data-label="Claims">
                          {formatNumber(row.accountCount)}
                        </td>
                        <td className="admin-num" data-label="Earned">
                          {formatCurrency(row.totalEarned)}
                        </td>
                        <td className="admin-num" data-label="Paid">
                          {formatCurrency(row.totalPaid)}
                        </td>
                        <td className="admin-num" data-label="Pending">
                          {formatCurrency(row.totalPending)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2 className="admin-section-title">Claim sources</h2>
              <p className="admin-section-note">
                {formatNumber(detail.records?.length || 0)} claims — who claimed, which account, and
                the manager share
              </p>
            </div>
            {!detail.records?.length ? (
              <p className="admin-empty">No claim records found.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table admin-table-wide">
                  <thead>
                    <tr>
                      <th>Claimed by (user)</th>
                      <th>Account</th>
                      <th>Link</th>
                      <th>Total</th>
                      <th>User 70%</th>
                      <th>Manager 30%</th>
                      <th>Paid</th>
                      <th>Claimed at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.records.map((record) => (
                      <tr key={String(record.id)}>
                        <td className="admin-cell-name" data-label="Claimed by">
                          {record.claimedByName || '—'}
                          {record.claimedByPhone ? (
                            <span className="admin-section-note">
                              {' '}
                              · {record.claimedByPhone}
                            </span>
                          ) : null}
                        </td>
                        <td data-label="Account">
                          {record.clientName || '—'}
                          {record.clientCode ? (
                            <span className="admin-section-note"> · {record.clientCode}</span>
                          ) : null}
                        </td>
                        <td data-label="Link">{record.linkName || '—'}</td>
                        <td className="admin-num" data-label="Total">
                          {formatCurrency(record.totalAmount)}
                        </td>
                        <td className="admin-num" data-label="User 70%">
                          {formatCurrency(record.userAmount)}
                        </td>
                        <td className="admin-num" data-label="Manager 30%">
                          {formatCurrency(record.managerAmount)}
                        </td>
                        <td data-label="Paid">
                          <span
                            className={`badge ${record.paidStatus ? 'badge-valid' : 'badge-blocked'}`}
                          >
                            {record.paidStatus ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td data-label="Claimed at">{formatDate(record.claimedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </AdminShell>
  )
}
