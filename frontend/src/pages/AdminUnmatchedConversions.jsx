import { useEffect, useState } from 'react'
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
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

function UnmatchedRow({ record, onMatched, onIgnored }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [searching, setSearching] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [rowMessage, setRowMessage] = useState('')

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setSelectedUser(null)
      return undefined
    }

    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        const data = await apiRequest(
          `/api/admin/users/search?query=${encodeURIComponent(trimmed)}`
        )
        setResults(data.users || [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query])

  function pickUser(user) {
    setSelectedUser(user)
    setQuery(`${user.name} (${user.phone})`)
    setResults([])
  }

  async function confirmMatch() {
    if (!selectedUser) return
    setBusyAction('match')
    setRowMessage('')
    try {
      await apiRequest(`/api/admin/conversions/${record._id}/match`, {
        method: 'PUT',
        body: JSON.stringify({ userId: selectedUser._id }),
      })
      setRowMessage('Matched')
      window.setTimeout(() => onMatched(record._id), 400)
    } catch (err) {
      setRowMessage(err.message || 'Match failed')
    } finally {
      setBusyAction('')
    }
  }

  async function ignoreRow() {
    setBusyAction('ignore')
    setRowMessage('')
    try {
      await apiRequest(`/api/admin/conversions/${record._id}/ignore`, {
        method: 'PUT',
      })
      setRowMessage('Ignored')
      window.setTimeout(() => onIgnored(record._id), 400)
    } catch (err) {
      setRowMessage(err.message || 'Ignore failed')
    } finally {
      setBusyAction('')
    }
  }

  const linkName = record.linkId?.name || '—'

  return (
    <tr>
      <td className="admin-cell-name" data-label="Client Name">
        {record.clientName || '—'}
      </td>
      <td data-label="Mobile">{record.mobile || '—'}</td>
      <td data-label="Client Code">{record.clientCode || '—'}</td>
      <td data-label="App Status">{record.appStatus || '—'}</td>
      <td data-label="Link Name">{linkName}</td>
      <td data-label="Uploaded">{formatDate(record.createdAt)}</td>
      <td data-label="Assign customer">
        <div className="admin-match-cell">
          <input
            className="admin-search admin-match-search"
            type="search"
            placeholder="Search name, phone, referral code..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSelectedUser(null)
            }}
            disabled={Boolean(busyAction)}
          />
          {searching ? <span className="admin-match-hint">Searching...</span> : null}
          {results.length ? (
            <ul className="admin-user-dropdown" role="listbox">
              {results.map((user) => (
                <li key={user._id}>
                  <button type="button" onClick={() => pickUser(user)}>
                    <strong>{user.name}</strong>
                    <span>
                      {user.phone || '—'} · {user.referralCode || 'no code'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {selectedUser ? (
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-match-confirm"
              onClick={confirmMatch}
              disabled={Boolean(busyAction)}
            >
              {busyAction === 'match' ? 'Matching…' : 'Confirm Match'}
            </button>
          ) : null}
        </div>
      </td>
      <td data-label="Actions">
        <div className="admin-row-actions">
          <button
            type="button"
            className="admin-btn admin-btn-muted"
            onClick={ignoreRow}
            disabled={Boolean(busyAction)}
          >
            {busyAction === 'ignore' ? 'Ignoring…' : 'Ignore'}
          </button>
          {rowMessage ? (
            <span
              className={
                rowMessage === 'Matched' || rowMessage === 'Ignored'
                  ? 'admin-match-success'
                  : 'admin-match-error'
              }
            >
              {rowMessage}
            </span>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

export default function AdminUnmatchedConversions() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadRecords() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/conversions/unmatched')
      setRecords(data.records || [])
    } catch (err) {
      setError(err.message || 'Failed to load unmatched records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  function removeRecord(id) {
    setRecords((prev) => prev.filter((record) => record._id !== id))
  }

  return (
    <AdminShell title="Unmatched Conversions">
      <div className="admin-page-intro">
        <h1>Unmatched conversions</h1>
        <p>
          Assign broker MIS rows to the correct customer when UTM matching did not find them
          automatically.
        </p>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-section-title">{records.length} unmatched records</h2>
        </div>

        {loading ? <p className="admin-loading">Loading unmatched records...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}

        {!loading && !error && !records.length ? (
          <p className="admin-empty">No unmatched records — all caught up!</p>
        ) : null}

        {!loading && records.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-wide">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Mobile</th>
                  <th>Client Code</th>
                  <th>App Status</th>
                  <th>Link Name</th>
                  <th>Uploaded Date</th>
                  <th>Assign customer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <UnmatchedRow
                    key={record._id}
                    record={record}
                    onMatched={removeRecord}
                    onIgnored={removeRecord}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AdminShell>
  )
}
