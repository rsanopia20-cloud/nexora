import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

// TODO: Protect this page with admin-only auth before production.

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

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

export default function AdminLinkDetail() {
  const { linkId } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await apiRequest(`/api/admin/analytics/links/${linkId}`)
        if (!cancelled) setDetail(data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load link detail')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [linkId])

  async function handlePermanentDelete() {
    const name = detail?.link?.name || 'this link'
    const ok = window.confirm(
      `Permanently delete “${name}”?\n\nThis cannot be undone. The link and its click/tracking history will be removed forever.`
    )
    if (!ok) return

    setDeleting(true)
    setError('')
    try {
      await apiRequest(`/api/admin/links/${linkId}/permanent`, {
        method: 'DELETE',
      })
      navigate('/admin/links', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to permanently delete link')
      setDeleting(false)
    }
  }

  return (
    <AdminShell title="Link Detail">
      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/links" className="admin-btn admin-btn-ghost">
          ← Back to links
        </Link>
        {!loading && detail ? (
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={handlePermanentDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </button>
        ) : null}
      </div>

      {loading ? <p className="admin-loading">Loading link details...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error && detail ? (
        <>
          <div className="admin-detail-head">
            <h1>{detail.link?.name}</h1>
            <p>
              <a href={detail.link?.destination} target="_blank" rel="noreferrer">
                {detail.link?.destination}
              </a>
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              <span className={`badge ${detail.link?.active ? 'badge-on' : 'badge-off'}`}>
                {detail.link?.active ? 'Active' : 'Removed'}
              </span>
            </p>
          </div>

          <div className="admin-meta">
            <div className="admin-meta-card">
              <span>Total attempts</span>
              <strong>{formatNumber(detail.totalAttempts)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Unique valid uses</span>
              <strong>{formatNumber(detail.uniqueValidUses)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Blocked / repeats</span>
              <strong>
                {formatNumber(
                  Math.max(0, (detail.totalAttempts || 0) - (detail.uniqueValidUses || 0))
                )}
              </strong>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2 className="admin-section-title">Click history</h2>
              <p className="admin-section-note">
                {formatNumber(detail.clicks?.length || 0)} records
              </p>
            </div>

            {!detail.clicks?.length ? (
              <p className="admin-empty">No clicks yet for this link.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Clicked at</th>
                      <th>IP address</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.clicks.map((click, index) => (
                      <tr key={`${click.userId}-${click.clickedAt}-${index}`}>
                        <td className="admin-cell-name" data-label="User">
                          {click.userName || '—'}
                        </td>
                        <td data-label="Email">{click.userEmail || '—'}</td>
                        <td data-label="Clicked at">{formatDate(click.clickedAt)}</td>
                        <td data-label="IP address">{click.ipAddress || '—'}</td>
                        <td data-label="Result">
                          <span
                            className={`badge ${
                              click.wasValidFirstClick ? 'badge-valid' : 'badge-blocked'
                            }`}
                          >
                            {click.wasValidFirstClick ? 'Valid' : 'Repeat'}
                          </span>
                        </td>
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
