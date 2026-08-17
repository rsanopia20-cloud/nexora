import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

// TODO: Protect this page with admin-only auth before production.

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
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

function shortenUrl(url, max = 36) {
  if (!url) return '—'
  if (url.length <= max) return url
  return `${url.slice(0, max - 1)}…`
}

export default function AdminUserDetail() {
  const { userId } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await apiRequest(`/api/admin/analytics/users/${userId}`)
        if (!cancelled) setDetail(data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load user analytics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <AdminShell title="User Analytics">
      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/users" className="admin-btn admin-btn-ghost">
          ← Back to users
        </Link>
      </div>

      {loading ? <p className="admin-loading">Loading user analytics...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error && detail ? (
        <>
          <div className="admin-detail-head">
            <h1>{detail.user?.fullName || detail.user?.name}</h1>
            <p>
              {detail.user?.email} · {detail.user?.mobile || detail.user?.phone}
            </p>
            <p className="admin-section-note">
              Joined {formatDate(detail.user?.createdAt)}
            </p>
          </div>

          <div className="admin-meta">
            <div className="admin-meta-card">
              <span>Click attempts</span>
              <strong>{formatNumber(detail.summary?.totalAttempts)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Valid uses</span>
              <strong>{formatNumber(detail.summary?.totalValidUses)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Links tracked</span>
              <strong>{formatNumber(detail.summary?.linksTracked)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Links used</span>
              <strong>{formatNumber(detail.summary?.linksUsed)}</strong>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2 className="admin-section-title">Link activity</h2>
              <p className="admin-section-note">
                {formatNumber(detail.history?.length || 0)} links
              </p>
            </div>

            {!detail.history?.length ? (
              <p className="admin-empty">This user has no tracked link activity yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Link</th>
                      <th>Destination</th>
                      <th>Tracking URL</th>
                      <th>Attempts</th>
                      <th>Status</th>
                      <th>Used at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.history.map((row) => (
                      <tr key={row.linkId}>
                        <td className="admin-cell-name" data-label="Link">
                          {row.linkName || '—'}
                        </td>
                        <td className="admin-cell-url" data-label="Destination">
                          {row.destination ? (
                            <a
                              href={row.destination}
                              target="_blank"
                              rel="noreferrer"
                              title={row.destination}
                            >
                              {shortenUrl(row.destination)}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="admin-cell-url" data-label="Tracking URL">
                          {row.trackingUrl ? (
                            <a
                              href={row.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={row.trackingUrl}
                            >
                              {shortenUrl(row.trackingUrl, 28)}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="admin-num" data-label="Attempts">
                          {formatNumber(row.attempts)}
                        </td>
                        <td data-label="Status">
                          <span
                            className={`badge ${row.wasUsed ? 'badge-valid' : 'badge-off'}`}
                          >
                            {row.wasUsed ? 'Used' : 'Not used'}
                          </span>
                        </td>
                        <td data-label="Used at">{formatDate(row.usedAt)}</td>
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
