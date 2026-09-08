import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

export default function AdminManagerDetail() {
  const { managerId } = useParams()
  const [form, setForm] = useState(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadManager() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest(`/api/admin/managers/${managerId}`)
      const manager = data.manager
      setForm({
        managerId: manager.managerId || '',
        fullName: manager.fullName || '',
        email: manager.email || '',
        mobile: manager.mobile || '',
        notes: manager.notes || '',
        active: Boolean(manager.active),
      })
    } catch (err) {
      setError(err.message || 'Failed to load manager')
      setForm(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadManager()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerId])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!form) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        managerId: form.managerId.trim().toUpperCase(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        notes: form.notes.trim(),
        active: Boolean(form.active),
      }
      if (password.trim()) {
        payload.password = password
      }

      const data = await apiRequest(`/api/admin/managers/${managerId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setForm({
        managerId: data.manager.managerId || '',
        fullName: data.manager.fullName || '',
        email: data.manager.email || '',
        mobile: data.manager.mobile || '',
        notes: data.manager.notes || '',
        active: Boolean(data.manager.active),
      })
      setPassword('')
      setSuccess('Manager updated.')
    } catch (err) {
      setError(err.message || 'Failed to update manager')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell title="Edit Manager">
      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/managers" className="admin-btn admin-btn-ghost">
          ← Back to managers
        </Link>
      </div>

      {loading ? <p className="admin-loading">Loading manager...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {success ? <p className="admin-success">{success}</p> : null}

      {!loading && form ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2 className="admin-section-title">Edit {form.fullName || 'manager'}</h2>
            <p className="admin-section-note">
              Change any detail anytime. Leave password blank to keep the current one.
            </p>
          </div>

          <form className="admin-form" onSubmit={handleSave}>
            <label>
              Manager ID
              <input
                className="admin-search"
                value={form.managerId}
                onChange={(e) => updateField('managerId', e.target.value.toUpperCase())}
                required
                disabled={saving}
              />
            </label>

            <label>
              Full name
              <input
                className="admin-search"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                required
                disabled={saving}
              />
            </label>

            <label>
              Email
              <input
                className="admin-search"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                disabled={saving}
              />
            </label>

            <label>
              Mobile
              <input
                className="admin-search"
                value={form.mobile}
                onChange={(e) => updateField('mobile', e.target.value)}
                disabled={saving}
              />
            </label>

            <label>
              New password (optional)
              <input
                className="admin-search"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                minLength={8}
                disabled={saving}
              />
            </label>

            <label>
              Notes
              <input
                className="admin-search"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                disabled={saving}
              />
            </label>

            <label className="admin-check-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField('active', e.target.checked)}
                disabled={saving}
              />
              Active (can log in)
            </label>

            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      ) : null}
    </AdminShell>
  )
}
