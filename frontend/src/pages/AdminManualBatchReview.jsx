import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import ConfirmDialog from '../components/ConfirmDialog'
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

function deleteSheetMessage(batch) {
  const name = batch.fileName || 'this sheet'
  const rows = Number(batch.totalRows || 0)
  const claimed = Number(batch.claimedCount || 0)
  const paid = Number(batch.paidCount || 0)
  let message = `Delete "${name}" from ${batch.linkName || 'its link'}? This removes ${rows} account${rows === 1 ? '' : 's'} from search and claim.`
  if (claimed > 0) {
    message += ` ${claimed} ${claimed === 1 ? 'has' : 'have'} already been claimed, so those earnings will disappear from the user and manager dashboards.`
  }
  if (paid > 0) {
    message += ` ${paid} ${paid === 1 ? 'is' : 'are'} already marked paid.`
  }
  message += ' This cannot be undone. The campaign link itself stays.'
  return message
}

export default function AdminManualBatchReview() {
  const { batchId } = useParams()
  const navigate = useNavigate()
  const [batch, setBatch] = useState(null)
  const [records, setRecords] = useState([])
  const [columns, setColumns] = useState([])
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  async function confirmDeleteSheet() {
    if (!batch || deleting) return
    setDeleting(true)
    setError('')
    try {
      await apiRequest(
        `/api/admin/conversions/manual-batches/${batch.id}?confirmClaims=1`,
        { method: 'DELETE' }
      )
      navigate('/admin/conversions/manual', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to delete this sheet')
      setConfirmDelete(false)
      setDeleting(false)
    }
  }

  return (
    <AdminShell title="Manual Sheet">
      <div className="admin-page-intro">
        <h1>{batch?.fileName || 'Manual Excel sheet'}</h1>
        <p>
          {batch
            ? `Link: ${batch.linkName}. Uploaded rows are shown as-is. Users claim their own accounts — no manual assignment needed.`
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
        {batch ? (
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={() => setConfirmDelete(true)}
          >
            Delete sheet
          </button>
        ) : null}
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

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this sheet?"
        message={batch ? deleteSheetMessage(batch) : ''}
        confirmLabel="Delete sheet"
        cancelLabel="Keep sheet"
        busy={deleting}
        onConfirm={confirmDeleteSheet}
        onCancel={() => {
          if (!deleting) setConfirmDelete(false)
        }}
      />
    </AdminShell>
  )
}
