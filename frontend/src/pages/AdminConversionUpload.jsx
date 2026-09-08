import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, getAdminToken } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function uploadConversionFile({ file, linkId }) {
  const token = getAdminToken()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('linkId', linkId)

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
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    try {
      const result = await uploadConversionFile({ file, linkId })
      setFile(null)
      event.target.reset()

      if (result.uploadBatchId) {
        setSuccess('Excel imported. Opening the sheet…')
        navigate(`/admin/conversions/manual/${result.uploadBatchId}`)
        return
      }

      setSuccess('Excel imported successfully.')
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
          Upload the broker sheet for a link. Any columns are fine — it&apos;s imported as-is.
          Users then claim their own Ready To Trade accounts by phone number or client id.
        </p>
      </div>

      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/conversions" className="admin-btn admin-btn-ghost">
          View Earnings
        </Link>
        <Link to="/admin/conversions/manual" className="admin-btn admin-btn-ghost">
          Uploaded Sheets
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
              {uploading ? 'Uploading...' : 'Upload Sheet'}
            </button>
          </form>
        ) : null}

        {selectedLink ? (
          <p className="admin-section-note" style={{ marginTop: '0.8rem' }}>
            Uploading for: <strong>{selectedLink.linkName}</strong>
          </p>
        ) : null}
      </div>
    </AdminShell>
  )
}
