import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

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

const EMPTY_FORM = {
  managerId: '',
  fullName: '',
  email: '',
  mobile: '',
  password: '',
  notes: '',
  active: true,
}

export default function AdminManagers() {
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [suggesting, setSuggesting] = useState(false)

  async function loadManagers() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/managers')
      setManagers(data.managers || [])
    } catch (err) {
      setError(err.message || 'Failed to load managers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadManagers()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return managers
    return managers.filter(
      (m) =>
        m.fullName?.toLowerCase().includes(q) ||
        m.managerId?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.mobile?.includes(q)
    )
  }, [managers, search])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function suggestId() {
    setSuggesting(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/managers/suggest-id')
      updateField('managerId', data.managerId || '')
    } catch (err) {
      setError(err.message || 'Failed to generate Manager ID')
    } finally {
      setSuggesting(false)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      await apiRequest('/api/admin/managers', {
        method: 'POST',
        body: JSON.stringify({
          managerId: form.managerId.trim().toUpperCase(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          password: form.password,
          notes: form.notes.trim(),
          active: Boolean(form.active),
        }),
      })
      setForm(EMPTY_FORM)
      setShowCreate(false)
      setSuccess('Manager account created.')
      await loadManagers()
    } catch (err) {
      setError(err.message || 'Failed to create manager')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AdminShell title="Managers">
      <div className="admin-page-intro">
        <h1>Managers</h1>
        <p>
          Create and manage manager accounts. Each manager gets a unique Manager ID and password
          for login. Deactivate an account when someone leaves.
        </p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className="admin-btn"
          onClick={() => {
            setShowCreate((open) => !open)
            setError('')
            setSuccess('')
          }}
        >
          {showCreate ? 'Close form' : 'Create manager'}
        </button>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {success ? <p className="admin-success">{success}</p> : null}

      {showCreate ? (
        <div className="admin-panel" style={{ marginBottom: '1rem' }}>
          <div className="admin-panel-head">
            <h2 className="admin-section-title">New manager</h2>
          </div>
          <form className="admin-form" onSubmit={handleCreate}>
            <label>
              Manager ID
              <div className="admin-inline-edit">
                <input
                  className="admin-search"
                  value={form.managerId}
                  onChange={(e) => updateField('managerId', e.target.value.toUpperCase())}
                  placeholder="e.g. MGR1A2B3C"
                  required
                  disabled={creating}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={suggestId}
                  disabled={creating || suggesting}
                >
                  {suggesting ? 'Generating…' : 'Generate ID'}
                </button>
              </div>
            </label>

            <label>
              Full name
              <input
                className="admin-search"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                required
                disabled={creating}
              />
            </label>

            <label>
              Email (optional)
              <input
                className="admin-search"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                disabled={creating}
              />
            </label>

            <label>
              Mobile (optional)
              <input
                className="admin-search"
                value={form.mobile}
                onChange={(e) => updateField('mobile', e.target.value)}
                placeholder="10-digit mobile"
                disabled={creating}
              />
            </label>

            <label>
              Password
              <input
                className="admin-search"
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
                disabled={creating}
              />
            </label>

            <label>
              Notes (optional)
              <input
                className="admin-search"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                disabled={creating}
              />
            </label>

            <label className="admin-check-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField('active', e.target.checked)}
                disabled={creating}
              />
              Active (can log in)
            </label>

            <button type="submit" className="admin-btn" disabled={creating}>
              {creating ? 'Creating…' : 'Create manager'}
            </button>
          </form>
        </div>
      ) : null}

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-section-title">
            All managers ({filtered.length})
          </h2>
          <input
            className="admin-search"
            type="search"
            placeholder="Search name, ID, email, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? <p className="admin-loading">Loading managers...</p> : null}

        {!loading && !filtered.length ? (
          <p className="admin-empty">No managers yet. Create the first one above.</p>
        ) : null}

        {!loading && filtered.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Manager ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((manager) => (
                  <tr key={manager.id}>
                    <td className="admin-cell-name" data-label="Manager ID">
                      {manager.managerId}
                    </td>
                    <td data-label="Name">{manager.fullName}</td>
                    <td data-label="Email">{manager.email || '—'}</td>
                    <td data-label="Mobile">{manager.mobile || '—'}</td>
                    <td data-label="Status">
                      <span className={`badge ${manager.active ? 'badge-on' : 'badge-off'}`}>
                        {manager.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td data-label="Created">{formatDate(manager.createdAt)}</td>
                    <td data-label="Actions">
                      <Link className="admin-btn-link" to={`/admin/managers/${manager.id}`}>
                        Edit
                      </Link>
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
