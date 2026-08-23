import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, getAdminToken } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

async function uploadConversionFile({ file, linkId, mode }) {
  const token = getAdminToken()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('linkId', linkId)
  formData.append('mode', mode)

  const response = await fetch(`${API_BASE}/api/admin/conversions/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    credentials: 'include',
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.message || `Upload failed (${response.status})`)
  }

  return data
}

export default function AdminConversionUpload() {
  const navigate = useNavigate()
  const [links, setLinks] = useState([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [linkId, setLinkId] = useState('')
  const [mode, setMode] = useState('auto')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [summary, setSummary] = useState(null)

  const selectedLink = useMemo(
    () => links.find((link) => String(link.linkId) === String(linkId)),
    [links, linkId]
  )

  useEffect(() => {
    let cancelled = false

    async function loadLinks() {
      setLoadingLinks(true)
      setError('')
      try {
        const data = await apiRequest('/api/admin/analytics/links')
        if (!cancelled) {
          const list = data.links || []
          setLinks(list)
          if (!linkId && list.length) setLinkId(String(list[0].linkId))
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load links')
      } finally {
        if (!cancelled) setLoadingLinks(false)
      }
    }

    loadLinks()
    return () => {
      cancelled = true
    }
  }, [linkId])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!file || !linkId) return

    setUploading(true)
    setError('')
    setSuccess('')
    setSummary(null)
    try {
      const result = await uploadConversionFile({ file, linkId, mode })
      setSummary(result)
      setFile(null)
      event.target.reset()

      if (result.mode === 'manual' && result.uploadBatchId) {
        setSuccess('Excel imported. Opening manual review…')
        navigate(`/admin/conversions/manual/${result.uploadBatchId}`)
        return
      }

      setSuccess('Excel processed successfully (auto-match).')
    } catch (err) {
      setError(err.message || 'Failed to upload Excel')
    } finally {
      setUploading(false)
    }
  }

  return (
    <AdminShell title="Upload Conversions">
      <div className="admin-page-intro">
        <h1>Upload broker MIS Excel</h1>
        <p>
          Choose automatic matching or manual review. Automatic keeps the existing UTM flow;
          manual shows the sheet as uploaded so you assign each row yourself.
        </p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/conversions" className="admin-btn admin-btn-ghost">
          View Earnings
        </Link>
        <Link to="/admin/conversions/unmatched" className="admin-btn admin-btn-ghost">
          Review Unmatched
        </Link>
        <Link to="/admin/conversions/manual" className="admin-btn admin-btn-ghost">
          Manual Reviews
        </Link>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-section-title">Upload file</h2>
          <p className="admin-section-note">Accepted formats: .xlsx, .xls (max 10MB)</p>
        </div>

        {loadingLinks ? <p className="admin-loading">Loading links...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
        {success ? <p className="admin-success">{success}</p> : null}

        {!loadingLinks ? (
          <form className="admin-form" onSubmit={handleSubmit}>
            <fieldset className="admin-mode-fieldset">
              <legend>Upload method</legend>
              <label className="admin-mode-option">
                <input
                  type="radio"
                  name="uploadMode"
                  value="auto"
                  checked={mode === 'auto'}
                  onChange={() => setMode('auto')}
                  disabled={uploading}
                />
                <span>
                  <strong>Automatic</strong>
                  <small>
                    Uses fixed broker columns (Client Code, UTM Medium, etc.) and matches
                    by referral code.
                  </small>
                </span>
              </label>
              <label className="admin-mode-option">
                <input
                  type="radio"
                  name="uploadMode"
                  value="manual"
                  checked={mode === 'manual'}
                  onChange={() => setMode('manual')}
                  disabled={uploading}
                />
                <span>
                  <strong>Manual review</strong>
                  <small>
                    Any Excel columns are fine. Sheet opens as-is; you search and assign
                    each row.
                  </small>
                </span>
              </label>
            </fieldset>

            <label>
              Broker / Link
              <select
                className="admin-search"
                value={linkId}
                onChange={(event) => setLinkId(event.target.value)}
                disabled={uploading || !links.length}
              >
                {links.map((link) => (
                  <option key={link.linkId} value={link.linkId}>
                    {link.linkName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Excel file
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                disabled={uploading}
              />
            </label>

            <button
              type="submit"
              className="admin-btn"
              disabled={uploading || !file || !linkId}
            >
              {uploading
                ? 'Uploading...'
                : mode === 'manual'
                  ? 'Upload for Manual Review'
                  : 'Upload & Auto-Match'}
            </button>
          </form>
        ) : null}

        {selectedLink ? (
          <p className="admin-section-note" style={{ marginTop: '0.8rem' }}>
            Uploading for: <strong>{selectedLink.linkName}</strong>
            {mode === 'manual' ? ' · Manual mode (no auto-assign)' : ' · Automatic mode'}
          </p>
        ) : null}
      </div>

      {summary && summary.mode !== 'manual' ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2 className="admin-section-title">Latest upload summary</h2>
            <p className="admin-section-note">Batch ID: {summary.uploadBatchId}</p>
          </div>
          <div className="admin-meta">
            <div className="admin-meta-card">
              <span>Total rows</span>
              <strong>{formatNumber(summary.totalRows)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Auto matched</span>
              <strong>{formatNumber(summary.autoMatchedCount)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Unmatched</span>
              <strong>{formatNumber(summary.unmatchedCount)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Self account</span>
              <strong>{formatNumber(summary.selfAccountCount)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Duplicate skipped</span>
              <strong>{formatNumber(summary.duplicateSkippedCount)}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
