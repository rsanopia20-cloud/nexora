import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

// TODO: Protect this page with admin-only auth before production.

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

function shortenUrl(url, max = 42) {
  if (!url) return '—'
  if (url.length <= max) return url
  return `${url.slice(0, max - 1)}…`
}

export default function AdminLinks() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState('all') // all | active | inactive

  async function loadLinks() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/analytics/links')
      setLinks(data.links || [])
    } catch (err) {
      setError(err.message || 'Failed to load links')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const visibleLinks = useMemo(() => {
    if (filter === 'active') return links.filter((l) => l.active)
    if (filter === 'inactive') return links.filter((l) => !l.active)
    return links
  }, [links, filter])

  async function handleCreate(event) {
    event.preventDefault()
    if (!name.trim() || !destination.trim()) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await apiRequest('/api/admin/links', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          destination: destination.trim(),
        }),
      })
      setName('')
      setDestination('')
      setSuccess('Link added successfully.')
      await loadLinks()
    } catch (err) {
      setError(err.message || 'Failed to create link')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(link) {
    setBusyId(link.linkId)
    setError('')
    setSuccess('')
    try {
      await apiRequest(`/api/admin/links/${link.linkId}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !link.active }),
      })
      setSuccess(link.active ? 'Link deactivated.' : 'Link activated.')
      await loadLinks()
    } catch (err) {
      setError(err.message || 'Failed to update link')
    } finally {
      setBusyId(null)
    }
  }

  async function removeLink(link) {
    const ok = window.confirm(
      `Remove “${link.linkName}”?\n\nIt will be deactivated and hidden from new signups. Click history is kept for analytics.`
    )
    if (!ok) return

    setBusyId(link.linkId)
    setError('')
    setSuccess('')
    try {
      await apiRequest(`/api/admin/links/${link.linkId}`, {
        method: 'DELETE',
      })
      setSuccess('Link removed (deactivated).')
      await loadLinks()
    } catch (err) {
      setError(err.message || 'Failed to remove link')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminShell title="Manage Links">
      <div className="admin-page-intro">
        <h1>Campaign links</h1>
        <p>Add new destination URLs, activate/deactivate them, or remove them from the active pool.</p>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-section-title">Add new link</h2>
        </div>
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="admin-form-row">
            <label>
              Link name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Demat Offer"
                required
              />
            </label>
            <label>
              Destination URL
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="https://partner.example.com/open"
                required
              />
            </label>
            <button className="admin-btn" type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add link'}
            </button>
          </div>
        </form>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {success ? <p className="admin-success">{success}</p> : null}

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-section-title">All links</h2>
          <div className="admin-filter-tabs">
            <button
              type="button"
              className={filter === 'all' ? 'is-active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({links.length})
            </button>
            <button
              type="button"
              className={filter === 'active' ? 'is-active' : ''}
              onClick={() => setFilter('active')}
            >
              Active ({links.filter((l) => l.active).length})
            </button>
            <button
              type="button"
              className={filter === 'inactive' ? 'is-active' : ''}
              onClick={() => setFilter('inactive')}
            >
              Removed ({links.filter((l) => !l.active).length})
            </button>
          </div>
        </div>

        {loading ? <p className="admin-loading">Loading links...</p> : null}

        {!loading && !visibleLinks.length ? (
          <p className="admin-empty">No links in this view.</p>
        ) : null}

        {!loading && visibleLinks.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Valid uses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                    {visibleLinks.map((link) => (
                  <tr
                    key={link.linkId}
                    className={link.active ? undefined : 'admin-muted-row'}
                  >
                    <td className="admin-cell-name" data-label="Name">
                      {link.linkName}
                    </td>
                    <td className="admin-cell-url" data-label="Destination">
                      <a href={link.destination} target="_blank" rel="noreferrer" title={link.destination}>
                        {shortenUrl(link.destination)}
                      </a>
                    </td>
                    <td data-label="Status">
                      <span className={`badge ${link.active ? 'badge-on' : 'badge-off'}`}>
                        {link.active ? 'Active' : 'Removed'}
                      </span>
                    </td>
                    <td className="admin-num" data-label="Attempts">
                      {formatNumber(link.totalAttempts)}
                    </td>
                    <td className="admin-num" data-label="Valid uses">
                      {formatNumber(link.uniqueValidUses)}
                    </td>
                    <td data-label="Actions">
                      <div className="admin-actions">
                        <Link className="admin-btn-link" to={`/admin/links/${link.linkId}`}>
                          Details
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost"
                          disabled={busyId === link.linkId}
                          onClick={() => toggleActive(link)}
                        >
                          {busyId === link.linkId
                            ? '...'
                            : link.active
                              ? 'Deactivate'
                              : 'Restore'}
                        </button>
                        {link.active ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            disabled={busyId === link.linkId}
                            onClick={() => removeLink(link)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AdminShell>
  )
}
