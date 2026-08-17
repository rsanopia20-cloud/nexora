import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await apiRequest('/api/admin/analytics/users')
        if (!cancelled) setUsers(data.users || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load users')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobile?.includes(q)
    )
  }, [users, search])

  return (
    <AdminShell title="Users">
      <div className="admin-page-intro">
        <h1>Registered users</h1>
        <p>View every user’s name, email, and mobile. Open a user for full click analytics.</p>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-section-title">
            All users ({formatNumber(filtered.length)})
          </h2>
          <input
            className="admin-search"
            type="search"
            placeholder="Search name, email, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? <p className="admin-loading">Loading users...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}

        {!loading && !filtered.length ? (
          <p className="admin-empty">No users found.</p>
        ) : null}

        {!loading && filtered.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Joined</th>
                  <th>Attempts</th>
                  <th>Valid uses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td className="admin-cell-name" data-label="Full name">
                      {user.fullName}
                    </td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Mobile">{user.mobile}</td>
                    <td data-label="Joined">{formatDate(user.createdAt)}</td>
                    <td className="admin-num" data-label="Attempts">
                      {formatNumber(user.totalAttempts)}
                    </td>
                    <td className="admin-num" data-label="Valid uses">
                      {formatNumber(user.totalValidUses)}
                    </td>
                    <td data-label="Actions">
                      <Link className="admin-btn-link" to={`/admin/users/${user.id}`}>
                        View analytics
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
