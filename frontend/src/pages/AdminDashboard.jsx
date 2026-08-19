import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, getAdminToken } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

// TODO: Protect this page with admin-only auth before production.

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [users, setUsers] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportError, setReportError] = useState('')
  const [reportBusy, setReportBusy] = useState(false)
  const [filters, setFilters] = useState({
    userId: '',
    linkId: '',
    fromDate: '',
    toDate: '',
  })

  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL || '').replace(/\/$/, ''),
    []
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [summaryData, usersData, linksData] = await Promise.all([
          apiRequest('/api/admin/analytics/summary'),
          apiRequest('/api/admin/analytics/users'),
          apiRequest('/api/admin/analytics/links'),
        ])
        if (!cancelled) {
          setSummary(summaryData)
          setUsers(usersData.users || [])
          setLinks(linksData.links || [])
        }
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

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function resetFilters() {
    setFilters({
      userId: '',
      linkId: '',
      fromDate: '',
      toDate: '',
    })
    setReportError('')
  }

  async function downloadReport(event) {
    event.preventDefault()
    setReportBusy(true)
    setReportError('')

    try {
      const params = new URLSearchParams()
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.linkId) params.set('linkId', filters.linkId)
      if (filters.fromDate) params.set('fromDate', filters.fromDate)
      if (filters.toDate) params.set('toDate', filters.toDate)

      const token = getAdminToken()
      const response = await fetch(
        `${apiBase}/api/admin/analytics/export${params.toString() ? `?${params}` : ''}`,
        {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        }
      )

      if (!response.ok) {
        let message = `Export failed (${response.status})`
        try {
          const data = await response.json()
          if (data?.message) message = data.message
        } catch {
          // ignore JSON parse error, keep fallback message
        }
        throw new Error(message)
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('content-disposition') || ''
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      const fileName = fileNameMatch?.[1] || 'nexora-analytics-report.xlsx'

      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setReportError(err.message || 'Unable to download report')
    } finally {
      setReportBusy(false)
    }
  }

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
              <h2 className="admin-section-title">Download reports (Excel)</h2>
              <p className="admin-section-note">Export click analytics Excel with filters</p>
            </div>
            <form className="admin-report-form" onSubmit={downloadReport}>
              <label className="admin-report-field">
                User filter
                <select name="userId" value={filters.userId} onChange={updateFilter}>
                  <option value="">All users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-report-field">
                Link filter
                <select name="linkId" value={filters.linkId} onChange={updateFilter}>
                  <option value="">All links</option>
                  {links.map((link) => (
                    <option key={link.linkId} value={link.linkId}>
                      {link.linkName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-report-field admin-report-field-date">
                From date
                <input
                  type="date"
                  name="fromDate"
                  value={filters.fromDate}
                  onChange={updateFilter}
                />
              </label>
              <label className="admin-report-field admin-report-field-date">
                To date
                <input
                  type="date"
                  name="toDate"
                  value={filters.toDate}
                  onChange={updateFilter}
                />
              </label>
              <div className="admin-report-actions">
                <button type="submit" className="admin-btn" disabled={reportBusy}>
                  {reportBusy ? 'Preparing...' : 'Download Excel'}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={resetFilters}
                  disabled={reportBusy}
                >
                  Reset
                </button>
              </div>
            </form>
            {reportError ? <p className="admin-error">{reportError}</p> : null}
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
