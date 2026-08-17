import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

// TODO: Protect this page with admin-only auth before production.

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await apiRequest('/api/admin/analytics/summary')
        if (!cancelled) setSummary(data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load summary')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AdminShell title="Dashboard">
      <div className="admin-page-intro">
        <h1>Analytics overview</h1>
        <p>Track users, click attempts, and top-performing campaign links.</p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1.25rem' }}>
        <Link to="/admin/links" className="admin-btn">
          Manage Links
        </Link>
        <Link to="/admin/users" className="admin-btn admin-btn-ghost">
          View Users
        </Link>
      </div>

      {loading ? <p className="admin-loading">Loading dashboard...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error && summary ? (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span>Total links</span>
              <strong>{formatNumber(summary.totalLinks)}</strong>
            </div>
            <div className="stat-card">
              <span>Total users</span>
              <strong>{formatNumber(summary.totalUsers)}</strong>
            </div>
            <div className="stat-card">
              <span>Click attempts</span>
              <strong>{formatNumber(summary.totalClickAttempts)}</strong>
            </div>
            <div className="stat-card">
              <span>Valid clicks</span>
              <strong>{formatNumber(summary.totalValidClicks)}</strong>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2 className="admin-section-title">Top 5 links</h2>
              <p className="admin-section-note">By unique valid uses</p>
            </div>

            {summary.topLinks?.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Link name</th>
                      <th>Unique valid uses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topLinks.map((row, index) => (
                      <tr key={`${row.linkName}-${index}`}>
                        <td className="admin-num" data-label="#">
                          {index + 1}
                        </td>
                        <td className="admin-cell-name" data-label="Link name">
                          {row.linkName}
                        </td>
                        <td className="admin-num" data-label="Unique valid uses">
                          {formatNumber(row.uniqueValidUses)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-empty">No links yet. Add your first link to get started.</p>
            )}
          </div>
        </>
      ) : null}
    </AdminShell>
  )
}
