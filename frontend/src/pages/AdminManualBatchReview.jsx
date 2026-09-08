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

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function cellDisplay(value) {
  if (value === undefined || value === null || value === '') return '—'
  return String(value)
}

function ClaimStatusCell({ record }) {
  const { matchType, matchedUser } = record

  if (matchType === 'claimed') {
    return (
      <div className="admin-manual-assign">
        <span className="admin-section-note">
          {matchedUser
            ? `${matchedUser.name} (${matchedUser.phone || '—'})`
            : 'Claimed'}
          {record.commissionAmount ? ` · ${formatCurrency(record.commissionAmount)}` : ''}
        </span>
        <span className="badge badge-on">Claimed</span>
      </div>
    )
  }

  if (matchType === 'manual' || matchType === 'auto') {
    return (
      <div className="admin-manual-assign">
        <span className="admin-section-note">
          {matchedUser
            ? `${matchedUser.name} (${matchedUser.phone || '—'})`
            : matchType}
        </span>
        <span className="badge badge-on">Assigned</span>
      </div>
    )
  }

  if (matchType === 'ignored') {
    return (
      <div className="admin-manual-assign">
        <span className="badge badge-off">Ignored</span>
      </div>
    )
  }

  return (
    <div className="admin-manual-assign">
      <span className="badge badge-off">Unclaimed</span>
    </div>
  )
}

export default function AdminManualBatchReview() {
  const { batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [records, setRecords] = useState([])
  const [columns, setColumns] = useState([])
  const [status, setStatus] = useState('all')
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

  return (
    <AdminShell title="Manual Sheet">
      <div className="admin-page-intro">
        <h1>{batch?.fileName || 'Manual Excel sheet'}</h1>
        <p>
          {batch
            ? `Link: ${batch.linkName}. Uploaded rows are shown as-is. Users claim their own Ready To Trade accounts — no manual assignment needed.`
            : 'Uploaded rows are shown as-is. Users claim their own accounts.'}
        </p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/conversions/manual" className="admin-btn admin-btn-ghost">
          All Manual Batches
        </Link>
        <Link to="/admin/conversions/upload" className="admin-btn admin-btn-ghost">
          Upload Another
        </Link>
        <Link to="/admin/conversions" className="admin-btn admin-btn-ghost">
          Customer Earnings
        </Link>
      </div>

      {batch ? (
        <div className="admin-meta" style={{ marginBottom: '1rem' }}>
          <div className="admin-meta-card">
            <span>Total rows</span>
            <strong>{batch.totalRows}</strong>
          </div>
          <div className="admin-meta-card">
            <span>Unclaimed</span>
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
              ? `${records.length} unclaimed rows`
              : status === 'assigned'
                ? `${records.length} claimed rows`
                : status === 'ignored'
                  ? `${records.length} ignored rows`
                  : `${records.length} rows`}
          </h2>
          <div className="admin-filter-tabs">
            <button
              type="button"
              className={status === 'all' ? 'is-active' : ''}
              onClick={() => setStatus('all')}
            >
              All
            </button>
            <button
              type="button"
              className={status === 'pending' ? 'is-active' : ''}
              onClick={() => setStatus('pending')}
            >
              Unclaimed
            </button>
            <button
              type="button"
              className={status === 'assigned' ? 'is-active' : ''}
              onClick={() => setStatus('assigned')}
            >
              Claimed
            </button>
            <button
              type="button"
              className={status === 'ignored' ? 'is-active' : ''}
              onClick={() => setStatus('ignored')}
            >
              Ignored
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
                  <th className="admin-assign-col">Claim status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="admin-num" data-label="#">
                      {record.rowIndex || '—'}
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column}
                        data-label={column}
                        title={cellDisplay(record.rawData?.[column])}
                      >
                        {cellDisplay(record.rawData?.[column])}
                      </td>
                    ))}
                    <td className="admin-assign-col" data-label="Claim status">
                      <ClaimStatusCell record={record} />
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
