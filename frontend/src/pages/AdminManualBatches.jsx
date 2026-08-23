import { useEffect, useState } from 'react'
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
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

export default function AdminManualBatches() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await apiRequest('/api/admin/conversions/manual-batches')
        if (!cancelled) setBatches(data.batches || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load manual batches')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AdminShell title="Manual Reviews">
      <div className="admin-page-intro">
        <h1>Manual Excel reviews</h1>
        <p>
          Sheets uploaded in Manual mode. Open a batch to see every column as in Excel and
          assign customers row by row.
        </p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/conversions/upload" className="admin-btn">
          New Upload
        </Link>
        <Link to="/admin/conversions/unmatched" className="admin-btn admin-btn-ghost">
          Auto Unmatched
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
                  <th>Still pending</th>
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
                    <td className="admin-num" data-label="Still pending">
                      {batch.unmatchedCount}
                    </td>
                    <td data-label="Uploaded">{formatDate(batch.uploadedAt)}</td>
                    <td data-label="Actions">
                      <Link
                        className="admin-btn-link"
                        to={`/admin/conversions/manual/${batch.id}`}
                      >
                        Open sheet
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
