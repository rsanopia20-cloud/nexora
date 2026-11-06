import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import ConfirmDialog from '../components/ConfirmDialog'
import { BankDetailsReadOnly } from '../components/BankDetailsForm'
import AdminPasswordField from '../components/AdminPasswordField'
import './Admin.css'

function deleteManagerMessage(manager) {
  const claims = Number(manager?.claimCount || 0)
  let message = `Delete ${manager?.fullName || 'this manager'} (${manager?.managerId || ''})? They will no longer be able to log in.`
  if (claims > 0) {
    message += ` ${claims} claimed account${claims === 1 ? '' : 's'} stay with the users who claimed them.`
  }
  message += ' This cannot be undone.'
  return message
}

export default function AdminManagerDetail() {
  const { managerId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [bankDetails, setBankDetails] = useState(null)
  const [hasBankDetails, setHasBankDetails] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
        claimCount: Number(manager.claimCount || 0),
      })
      setBankDetails(manager.bankDetails || null)
      setHasBankDetails(Boolean(manager.hasBankDetails))
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
        claimCount: Number(data.manager.claimCount || form.claimCount || 0),
      })
      setPassword('')
      setSuccess('Manager updated.')
    } catch (err) {
      setError(err.message || 'Failed to update manager')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDeleteManager() {
    if (!form || deleting) return
    setDeleting(true)
    setError('')
    try {
      await apiRequest(`/api/admin/managers/${managerId}`, { method: 'DELETE' })
      navigate('/admin/managers', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to delete manager')
      setConfirmDelete(false)
      setDeleting(false)
    }
  }

  return (
    <AdminShell title="Edit Manager">
      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/managers" className="admin-btn admin-btn-ghost">
          ← Back to managers
        </Link>
        {form ? (
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={() => setConfirmDelete(true)}
            disabled={saving || deleting}
          >
            Delete manager
          </button>
        ) : null}
      </div>

      {loading ? <p className="admin-loading">Loading manager...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {success ? <p className="admin-success">{success}</p> : null}

      {!loading && form ? (
        <>
          <div className="admin-panel" style={{ marginBottom: '1rem' }}>
            <div className="admin-panel-head">
              <h2 className="admin-section-title">Bank details</h2>
              <p className="admin-section-note">
                {hasBankDetails
                  ? 'Payout account provided by the manager'
                  : 'Manager has not added bank details yet'}
              </p>
            </div>
            <BankDetailsReadOnly bankDetails={bankDetails} />
          </div>

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
              <AdminPasswordField
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
        </>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this manager?"
        message={form ? deleteManagerMessage(form) : ''}
        confirmLabel="Delete manager"
        cancelLabel="Keep manager"
        busy={deleting}
        onConfirm={confirmDeleteManager}
        onCancel={() => {
          if (!deleting) setConfirmDelete(false)
        }}
      />
    </AdminShell>
  )
}
