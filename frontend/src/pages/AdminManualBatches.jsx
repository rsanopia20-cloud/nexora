import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function AdminManualBatches() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/conversions/manual-batches')
      setBatches(data.batches || [])
    } catch (err) {
      setError(err.message || 'Failed to load manual batches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function confirmDelete() {
    if (!pendingDelete || deleting) return
    setDeleting(true)
    setError('')
    try {
      await apiRequest(
        `/api/admin/conversions/manual-batches/${pendingDelete.id}?confirmClaims=1`,
        { method: 'DELETE' }
      )
      setPendingDelete(null)
      await load()
    } catch (err) {
      setError(err.message || 'Unable to delete this sheet')
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminShell title="Manual Reviews">
      <div className="admin-page-intro">
        <h1>Manual Excel reviews</h1>
        <p>
          Sheets uploaded in Manual mode. Open a batch to view every column as in Excel and see
          which accounts users have claimed. Users claim their own accounts.
        </p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/conversions/upload" className="admin-btn">
          New Upload
        </Link>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-section-title">{batches.length} manual batches</h2>
        </div>

        {loading ? <p className="admin-loading">Loading batches...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}

        {!loading && !error && !batches.length ? (
          <p className="admin-empty">
            No manual uploads yet. Choose Manual review on the Upload page.
          </p>
        ) : null}

        {!loading && batches.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Link</th>
                  <th>Rows</th>
                  <th>Unclaimed</th>
                  <th>Claimed</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="admin-cell-name" data-label="File">
                      {batch.fileName || '—'}
                    </td>
                    <td data-label="Link">{batch.linkName}</td>
                    <td className="admin-num" data-label="Rows">
                      {batch.totalRows}
                    </td>
                    <td className="admin-num" data-label="Unclaimed">
                      {batch.unmatchedCount}
                    </td>
                    <td className="admin-num" data-label="Claimed">
                      {batch.claimedCount || 0}
                    </td>
                    <td data-label="Uploaded">{formatDate(batch.uploadedAt)}</td>
                    <td data-label="Actions">
                      <div className="admin-actions">
                        <Link
                          className="admin-btn-link"
                          to={`/admin/conversions/manual/${batch.id}`}
                        >
                          Open sheet
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => setPendingDelete(batch)}
                        >
                          Delete sheet
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this sheet?"
        message={pendingDelete ? deleteSheetMessage(pendingDelete) : ''}
        confirmLabel="Delete sheet"
        cancelLabel="Keep sheet"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deleting) setPendingDelete(null)
        }}
      />
    </AdminShell>
  )
}
