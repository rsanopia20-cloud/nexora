import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

function cellDisplay(value) {
  if (value === undefined || value === null || value === '') return '—'
  return String(value)
}

function ManualRow({ record, columns, onResolved }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [searching, setSearching] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [rowMessage, setRowMessage] = useState('')

  const isPending = record.matchType === 'unmatched'

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || !isPending) {
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
  }, [query, isPending])

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
      await apiRequest(`/api/admin/conversions/${record.id}/match`, {
        method: 'PUT',
        body: JSON.stringify({ userId: selectedUser._id }),
      })
      setRowMessage('Assigned')
      window.setTimeout(() => onResolved(record.id), 400)
    } catch (err) {
      setRowMessage(err.message || 'Assign failed')
    } finally {
      setBusyAction('')
    }
  }

  async function ignoreRow() {
    setBusyAction('ignore')
    setRowMessage('')
    try {
      await apiRequest(`/api/admin/conversions/${record.id}/ignore`, {
        method: 'PUT',
      })
      setRowMessage('Ignored')
      window.setTimeout(() => onResolved(record.id), 400)
    } catch (err) {
      setRowMessage(err.message || 'Ignore failed')
    } finally {
      setBusyAction('')
    }
  }

  return (
    <tr>
      <td className="admin-num" data-label="#">
        {record.rowIndex || '—'}
      </td>
      {columns.map((column) => (
        <td key={column} data-label={column} title={cellDisplay(record.rawData?.[column])}>
          {cellDisplay(record.rawData?.[column])}
        </td>
      ))}
      <td className="admin-assign-col" data-label="Assign customer">
        {!isPending ? (
          <div className="admin-manual-assign">
            <span className="admin-section-note">
              {record.matchedUser
                ? `${record.matchedUser.name} (${record.matchedUser.phone || '—'})`
                : record.matchType}
            </span>
            <span
              className={`badge ${record.matchType === 'ignored' ? 'badge-off' : 'badge-on'}`}
            >
              {record.matchType}
            </span>
          </div>
        ) : (
          <div className="admin-manual-assign">
            <input
              className="admin-search admin-match-search"
              type="search"
              placeholder="Search name, phone, or code..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSelectedUser(null)
              }}
              disabled={Boolean(busyAction)}
            />
            {searching ? <span className="admin-match-hint">Searching...</span> : null}
            {!searching && query.trim() && !results.length && !selectedUser ? (
              <span className="admin-match-hint">No users found</span>
            ) : null}
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
            <div className="admin-row-actions">
              {selectedUser ? (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={confirmMatch}
                  disabled={Boolean(busyAction)}
                >
                  {busyAction === 'match' ? 'Assigning…' : 'Confirm Assign'}
                </button>
              ) : null}
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
                    rowMessage === 'Assigned' || rowMessage === 'Ignored'
                      ? 'admin-match-success'
                      : 'admin-match-error'
                  }
                >
                  {rowMessage}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function AdminManualBatchReview() {
  const { batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [records, setRecords] = useState([])
  const [columns, setColumns] = useState([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadBatch(nextStatus = status) {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest(
        `/api/admin/conversions/manual-batches/${batchId}?status=${encodeURIComponent(nextStatus)}`
      )
      setBatch(data.batch || null)
      setColumns(data.batch?.columns || [])
      setRecords(data.records || [])
    } catch (err) {
      setError(err.message || 'Failed to load manual sheet')
      setBatch(null)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBatch(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, status])

  function removeRecord(id) {
    setRecords((prev) => prev.filter((record) => record.id !== id))
    setBatch((prev) =>
      prev
        ? {
            ...prev,
            unmatchedCount: Math.max(0, Number(prev.unmatchedCount || 0) - 1),
          }
        : prev
    )
  }

  return (
    <AdminShell title="Manual Sheet Review">
      <div className="admin-page-intro">
        <h1>{batch?.fileName || 'Manual Excel sheet'}</h1>
        <p>
          {batch
            ? `Link: ${batch.linkName}. Columns match your uploaded file — assign each row to a customer.`
            : 'Review uploaded rows and assign customers manually.'}
        </p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/conversions/manual" className="admin-btn admin-btn-ghost">
          All Manual Batches
        </Link>
        <Link to="/admin/conversions/upload" className="admin-btn admin-btn-ghost">
          Upload Another
        </Link>
      </div>

      {batch ? (
        <div className="admin-meta" style={{ marginBottom: '1rem' }}>
          <div className="admin-meta-card">
            <span>Total rows</span>
            <strong>{batch.totalRows}</strong>
          </div>
          <div className="admin-meta-card">
            <span>Still pending</span>
            <strong>{batch.unmatchedCount}</strong>
          </div>
          <div className="admin-meta-card">
            <span>Duplicates skipped</span>
            <strong>{batch.duplicateSkippedCount || 0}</strong>
          </div>
          <div className="admin-meta-card">
            <span>Uploaded</span>
            <strong>{formatDate(batch.uploadedAt)}</strong>
          </div>
        </div>
      ) : null}

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-section-title">
            {status === 'pending'
              ? `${records.length} pending rows`
              : status === 'assigned'
                ? `${records.length} assigned rows`
                : `${records.length} ignored rows`}
          </h2>
          <div className="admin-filter-tabs">
            <button
              type="button"
              className={status === 'pending' ? 'is-active' : ''}
              onClick={() => setStatus('pending')}
            >
              Pending
            </button>
            <button
              type="button"
              className={status === 'assigned' ? 'is-active' : ''}
              onClick={() => setStatus('assigned')}
            >
              Assigned
            </button>
            <button
              type="button"
              className={status === 'ignored' ? 'is-active' : ''}
              onClick={() => setStatus('ignored')}
            >
              Ignored
            </button>
            <button
              type="button"
              className={status === 'all' ? 'is-active' : ''}
              onClick={() => setStatus('all')}
            >
              All
            </button>
          </div>
        </div>

        {loading ? <p className="admin-loading">Loading sheet...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}

        {!loading && !error && !records.length ? (
          <p className="admin-empty">No rows in this view.</p>
        ) : null}

        {!loading && records.length ? (
          <div className="admin-table-wrap admin-manual-sheet-wrap">
            <table className="admin-table admin-table-wide admin-manual-sheet">
              <thead>
                <tr>
                  <th>#</th>
                  {columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                  <th className="admin-assign-col">Assign customer</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <ManualRow
                    key={record.id}
                    record={record}
                    columns={columns}
                    onResolved={removeRecord}
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
