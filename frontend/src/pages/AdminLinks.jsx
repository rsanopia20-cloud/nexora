import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

// TODO: Protect this page with admin-only auth before production.

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
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
  const [commissionAmount, setCommissionAmount] = useState('0')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState('all') // all | active | inactive
  const [dragId, setDragId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [canDrag, setCanDrag] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDestination, setEditDestination] = useState('')
  const [editCommission, setEditCommission] = useState('0')

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

  useEffect(() => {
    const media = window.matchMedia('(min-width: 860px)')
    const sync = () => setCanDrag(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const visibleLinks = useMemo(() => {
    if (filter === 'active') return links.filter((l) => l.active)
    if (filter === 'inactive') return links.filter((l) => !l.active)
    return links
  }, [links, filter])

  function startEdit(link) {
    setEditingId(link.linkId)
    setEditName(link.linkName || '')
    setEditDestination(link.destination || '')
    setEditCommission(String(link.commissionAmount ?? 0))
    setError('')
    setSuccess('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditDestination('')
    setEditCommission('0')
  }

  async function handleCreate(event) {
    event.preventDefault()
    if (!name.trim() || !destination.trim()) return

    const amount = Number(commissionAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Commission amount must be 0 or more')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await apiRequest('/api/admin/links', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          destination: destination.trim(),
          commissionAmount: amount,
        }),
      })
      setName('')
      setDestination('')
      setCommissionAmount('0')
      setSuccess('Link added successfully.')
      await loadLinks()
    } catch (err) {
      setError(err.message || 'Failed to create link')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit(link) {
    const nextName = editName.trim()
    const nextDestination = editDestination.trim()
    const nextCommission = Number(editCommission)

    if (!nextName || !nextDestination) {
      setError('Name and destination are required')
      return
    }
    if (!Number.isFinite(nextCommission) || nextCommission < 0) {
      setError('Commission amount must be 0 or more')
      return
    }

    const payload = {}
    if (nextName !== (link.linkName || '')) payload.name = nextName
    if (nextDestination !== (link.destination || '')) {
      payload.destination = nextDestination
    }
    if (Number(link.commissionAmount || 0) !== nextCommission) {
      payload.commissionAmount = nextCommission
    }

    if (!Object.keys(payload).length) {
      cancelEdit()
      return
    }

    setBusyId(link.linkId)
    setError('')
    setSuccess('')
    try {
      await apiRequest(`/api/admin/links/${link.linkId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setSuccess('Link updated.')
      cancelEdit()
      await loadLinks()
    } catch (err) {
      setError(err.message || 'Failed to update link')
    } finally {
      setBusyId(null)
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

  function mergeVisibleOrder(nextVisible) {
    if (filter === 'all') return nextVisible
    const queue = [...nextVisible]
    return links.map((link) => {
      const inView = filter === 'active' ? link.active : !link.active
      return inView ? queue.shift() : link
    })
  }

  async function persistOrder(nextLinks) {
    const previous = links
    setLinks(nextLinks)
    setBusyId('reorder')
    setError('')
    setSuccess('')
    try {
      await apiRequest('/api/admin/links/reorder', {
        method: 'PUT',
        body: JSON.stringify({
          orderedIds: nextLinks.map((link) => link.linkId),
        }),
      })
      setSuccess('Link order saved. New WhatsApp messages will use this order.')
    } catch (err) {
      setLinks(previous)
      setError(err.message || 'Failed to save link order')
    } finally {
      setBusyId(null)
    }
  }

  function moveLink(linkId, direction) {
    if (busyId) return
    const list = [...visibleLinks]
    const index = list.findIndex((link) => link.linkId === linkId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= list.length) return
    const swapped = [...list]
    ;[swapped[index], swapped[target]] = [swapped[target], swapped[index]]
    persistOrder(mergeVisibleOrder(swapped))
  }

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId || busyId) {
      setDragId(null)
      setDragOverId(null)
      return
    }
    const list = [...visibleLinks]
    const from = list.findIndex((link) => link.linkId === dragId)
    const to = list.findIndex((link) => link.linkId === targetId)
    setDragId(null)
    setDragOverId(null)
    if (from < 0 || to < 0) return
    const next = [...list]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    persistOrder(mergeVisibleOrder(next))
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
        <p>
          Add, activate, or remove destination URLs. Use the arrows to set the
          order — that same order is used in WhatsApp messages.
        </p>
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
            <label>
              Commission Amount (₹)
              <input
                type="number"
                min="0"
                step="1"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
                placeholder="0"
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
                  <th>Order</th>
                  <th>Name</th>
                  <th>Destination</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Valid uses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleLinks.map((link, index) => {
                  const isEditing = editingId === link.linkId

                  return (
                    <tr
                      key={link.linkId}
                      draggable={canDrag && !busyId && !isEditing}
                      onDragStart={() => setDragId(link.linkId)}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setDragOverId(link.linkId)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        handleDrop(link.linkId)
                      }}
                      onDragEnd={() => {
                        setDragId(null)
                        setDragOverId(null)
                      }}
                      className={[
                        link.active ? '' : 'admin-muted-row',
                        dragId === link.linkId ? 'is-dragging' : '',
                        dragOverId === link.linkId && dragId !== link.linkId
                          ? 'is-drag-over'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined}
                    >
                      <td className="admin-order-cell" data-label="Order">
                        <div
                          className="admin-order-controls"
                          onPointerDown={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="admin-order-btn"
                            aria-label={`Move ${link.linkName} up`}
                            disabled={busyId != null || index === 0 || isEditing}
                            onClick={() => moveLink(link.linkId, -1)}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="admin-order-btn"
                            aria-label={`Move ${link.linkName} down`}
                            disabled={
                              busyId != null ||
                              index === visibleLinks.length - 1 ||
                              isEditing
                            }
                            onClick={() => moveLink(link.linkId, 1)}
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                      <td className="admin-cell-name" data-label="Name">
                        {isEditing ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            aria-label="Edit link name"
                            required
                          />
                        ) : (
                          link.linkName
                        )}
                      </td>
                      <td className="admin-cell-url" data-label="Destination">
                        {isEditing ? (
                          <input
                            value={editDestination}
                            onChange={(e) => setEditDestination(e.target.value)}
                            aria-label="Edit destination URL"
                            required
                          />
                        ) : (
                          <a
                            href={link.destination}
                            target="_blank"
                            rel="noreferrer"
                            title={link.destination}
                          >
                            {shortenUrl(link.destination)}
                          </a>
                        )}
                      </td>
                      <td className="admin-num" data-label="Commission">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editCommission}
                            onChange={(e) => setEditCommission(e.target.value)}
                            aria-label="Edit commission amount"
                            required
                          />
                        ) : (
                          formatCurrency(link.commissionAmount)
                        )}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`badge ${link.active ? 'badge-on' : 'badge-off'}`}
                        >
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
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="admin-btn"
                                disabled={busyId === link.linkId}
                                onClick={() => handleSaveEdit(link)}
                              >
                                {busyId === link.linkId ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn-ghost"
                                disabled={busyId === link.linkId}
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn-ghost"
                                disabled={busyId != null}
                                onClick={() => startEdit(link)}
                              >
                                Edit
                              </button>
                              <Link
                                className="admin-btn-link"
                                to={`/admin/links/${link.linkId}`}
                              >
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AdminShell>
  )
}
