import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import AdminShell from '../components/AdminShell'
import './Admin.css'

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

function formatCurrency(value) {
  return `₹${formatNumber(value)}`
}

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

function UserSearchField({ value, onChange }) {
  const [query, setQuery] = useState(
    value?.name ? `${value.name} (${value.phone || '—'})` : ''
  )
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || (value?.name && query.startsWith(value.name))) {
      setResults([])
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
  }, [query, value?.name])

  return (
    <div className="admin-match-cell">
      <input
        className="admin-search admin-match-search"
        type="search"
        placeholder="Search name, phone, referral code..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          onChange(null)
        }}
      />
      {searching ? <span className="admin-match-hint">Searching...</span> : null}
      {results.length ? (
        <ul className="admin-user-dropdown" role="listbox">
          {results.map((user) => (
            <li key={user._id}>
              <button
                type="button"
                onClick={() => {
                  onChange(user)
                  setQuery(`${user.name} (${user.phone || '—'})`)
                  setResults([])
                }}
              >
                <strong>{user.name}</strong>
                <span>
                  {user.phone || '—'} · {user.referralCode || 'no code'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function RecordEditor({ record, onClose, onSaved }) {
  const [selectedUser, setSelectedUser] = useState(
    record.matchedUserId
      ? {
          _id: record.matchedUserId,
          name: record.matchedUserName,
          phone: record.matchedUserPhone,
        }
      : null
  )
  const [isPayable, setIsPayable] = useState(Boolean(record.isPayable))
  const [commissionAmount, setCommissionAmount] = useState(
    String(record.commissionAmount ?? 0)
  )
  const [paidStatus, setPaidStatus] = useState(Boolean(record.paidStatus))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    const payload = {}
    const currentUserId = record.matchedUserId ? String(record.matchedUserId) : ''
    const nextUserId = selectedUser?._id ? String(selectedUser._id) : ''
    if (currentUserId !== nextUserId) payload.matchedUserId = selectedUser?._id || null
    if (Boolean(record.isPayable) !== isPayable) payload.isPayable = isPayable
    if (Number(record.commissionAmount || 0) !== Number(commissionAmount)) {
      payload.commissionAmount = Number(commissionAmount)
    }
    if (Boolean(record.paidStatus) !== paidStatus) payload.paidStatus = paidStatus

    if (!Object.keys(payload).length) {
      setMessage('No changes to save')
      return
    }

    setSaving(true)
    setMessage('')
    try {
      await apiRequest(`/api/admin/conversions/${record.id}/edit`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      await onSaved()
      onClose()
    } catch (err) {
      setMessage(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-edit-panel">
      <p className="admin-section-note">Edit {record.clientCode || 'record'}</p>
      <label>
        Matched customer
        <UserSearchField value={selectedUser} onChange={setSelectedUser} />
      </label>
      <label className="admin-check-row">
        <input
          type="checkbox"
          checked={isPayable}
          onChange={(event) => setIsPayable(event.target.checked)}
        />
        Payable
      </label>
      <label>
        Commission amount
        <input
          type="number"
          min="0"
          step="1"
          value={commissionAmount}
          onChange={(event) => setCommissionAmount(event.target.value)}
        />
      </label>
      <label className="admin-check-row">
        <input
          type="checkbox"
          checked={paidStatus}
          onChange={(event) => setPaidStatus(event.target.checked)}
        />
        Paid
      </label>
      {message ? <p className="admin-match-error">{message}</p> : null}
      <div className="admin-row-actions" style={{ flexDirection: 'row' }}>
        <button type="button" className="admin-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="admin-btn admin-btn-muted" onClick={onClose} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function AdminConversionCustomerDetail() {
  const { userId } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [markingPaid, setMarkingPaid] = useState(false)
  const [editingCode, setEditingCode] = useState(false)
  const [referralDraft, setReferralDraft] = useState('')
  const [savingCode, setSavingCode] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState('')
  const [historyRecordId, setHistoryRecordId] = useState('')

  async function loadDetail({ keepSuccess = false } = {}) {
    setLoading(true)
    setError('')
    if (!keepSuccess) setSuccess('')
    try {
      const data = await apiRequest(`/api/admin/conversions/customers/${userId}`)
      setDetail(data)
      setReferralDraft(data.user?.referralCode || '')
    } catch (err) {
      setError(err.message || 'Failed to load customer earnings detail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [userId])

  async function handleMarkPaid() {
    const pending = Number(detail?.totalPending || 0)
    if (pending <= 0) return
    const name = detail?.user?.name || 'this customer'
    const ok = window.confirm(`Mark ${formatCurrency(pending)} as paid for ${name}?`)
    if (!ok) return

    setMarkingPaid(true)
    setError('')
    try {
      await apiRequest(`/api/admin/conversions/customers/${userId}/mark-paid`, {
        method: 'PUT',
      })
      await loadDetail()
    } catch (err) {
      setError(err.message || 'Failed to mark as paid')
    } finally {
      setMarkingPaid(false)
    }
  }

  async function saveReferralCode() {
    const next = referralDraft.trim()
    if (!next) {
      setError('Referral code cannot be empty')
      return
    }
    setSavingCode(true)
    setError('')
    setSuccess('')
    try {
      const data = await apiRequest(`/api/admin/users/${userId}/referral-code`, {
        method: 'PUT',
        body: JSON.stringify({ referralCode: next }),
      })
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              user: { ...prev.user, referralCode: data.user?.referralCode || next },
            }
          : prev
      )
      setEditingCode(false)
      setSuccess('Referral code updated.')
    } catch (err) {
      setError(err.message || 'Failed to update referral code')
    } finally {
      setSavingCode(false)
    }
  }

  return (
    <AdminShell title="Customer Earnings Detail">
      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <Link to="/admin/conversions" className="admin-btn admin-btn-ghost">
          ← Back to earnings
        </Link>
        {!loading && detail ? (
          <button
            type="button"
            className="admin-btn"
            disabled={Number(detail.totalPending || 0) <= 0 || markingPaid}
            onClick={handleMarkPaid}
          >
            {markingPaid ? 'Updating...' : `Mark Pending ${formatCurrency(detail.totalPending)} Paid`}
          </button>
        ) : null}
      </div>

      {loading ? <p className="admin-loading">Loading customer details...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {success ? <p className="admin-success">{success}</p> : null}

      {!loading && !error && detail ? (
        <>
          <div className="admin-detail-head">
            <h1>{detail.user?.name || 'Unknown customer'}</h1>
            <p>
              {detail.user?.phone || '—'} · Referral code:{' '}
              {editingCode ? (
                <span className="admin-inline-edit">
                  <input
                    className="admin-search"
                    value={referralDraft}
                    onChange={(event) => setReferralDraft(event.target.value)}
                    disabled={savingCode}
                  />
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={saveReferralCode}
                    disabled={savingCode}
                  >
                    {savingCode ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-muted"
                    onClick={() => {
                      setEditingCode(false)
                      setReferralDraft(detail.user?.referralCode || '')
                    }}
                    disabled={savingCode}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <>
                  <strong>{detail.user?.referralCode || '—'}</strong>{' '}
                  <button
                    type="button"
                    className="admin-btn-link"
                    onClick={() => setEditingCode(true)}
                  >
                    Edit
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="admin-meta">
            <div className="admin-meta-card">
              <span>Total earned</span>
              <strong>{formatCurrency(detail.totalEarned)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Total paid</span>
              <strong>{formatCurrency(detail.totalPaid)}</strong>
            </div>
            <div className="admin-meta-card">
              <span>Total pending</span>
              <strong>{formatCurrency(detail.totalPending)}</strong>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2 className="admin-section-title">By link</h2>
            </div>
            {!detail.byLink?.length ? (
              <p className="admin-empty">No payable records for this customer yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Link</th>
                      <th>Accounts</th>
                      <th>Earned</th>
                      <th>Paid</th>
                      <th>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.byLink.map((row) => (
                      <tr key={String(row.linkId)}>
                        <td className="admin-cell-name" data-label="Link">
                          {row.linkName}
                        </td>
                        <td className="admin-num" data-label="Accounts">
                          {formatNumber(row.accountCount)}
                        </td>
                        <td className="admin-num" data-label="Earned">
                          {formatCurrency(row.totalEarned)}
                        </td>
                        <td className="admin-num" data-label="Paid">
                          {formatCurrency(row.totalPaid)}
                        </td>
                        <td className="admin-num" data-label="Pending">
                          {formatCurrency(row.totalPending)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2 className="admin-section-title">Conversion records</h2>
              <p className="admin-section-note">{formatNumber(detail.records?.length || 0)} records</p>
            </div>
            {!detail.records?.length ? (
              <p className="admin-empty">No records found.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Client Code</th>
                      <th>App Status</th>
                      <th>Link</th>
                      <th>Amount</th>
                      <th>Payable</th>
                      <th>Paid Status</th>
                      <th>Paid At</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.records.map((record) => (
                      <tr key={String(record.id)}>
                        <td className="admin-cell-name" data-label="Client Name">
                          {record.clientName || 'Referred account'}
                        </td>
                        <td data-label="Client Code">{record.clientCode || '—'}</td>
                        <td data-label="App Status">{record.appStatus || '—'}</td>
                        <td data-label="Link">{record.linkName || '—'}</td>
                        <td className="admin-num" data-label="Amount">
                          {formatCurrency(record.commissionAmount)}
                        </td>
                        <td data-label="Payable">{record.isPayable ? 'Yes' : 'No'}</td>
                        <td data-label="Paid Status">
                          <span className={`badge ${record.paidStatus ? 'badge-valid' : 'badge-blocked'}`}>
                            {record.paidStatus ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td data-label="Paid At">{formatDate(record.paidAt)}</td>
                        <td data-label="Created At">{formatDate(record.createdAt)}</td>
                        <td data-label="Actions">
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="admin-btn admin-btn-muted"
                              onClick={() =>
                                setEditingRecordId((current) =>
                                  current === record.id ? '' : record.id
                                )
                              }
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="admin-btn-link"
                              onClick={() =>
                                setHistoryRecordId((current) =>
                                  current === record.id ? '' : record.id
                                )
                              }
                            >
                              View History
                            </button>
                            {editingRecordId === record.id ? (
                              <RecordEditor
                                record={record}
                                onClose={() => setEditingRecordId('')}
                                onSaved={async () => {
                                  setSuccess('Record updated.')
                                  await loadDetail({ keepSuccess: true })
                                }}
                              />
                            ) : null}
                            {historyRecordId === record.id ? (
                              <ul className="admin-history-list">
                                {(record.editHistory || []).length ? (
                                  [...record.editHistory].reverse().map((entry, index) => (
                                    <li key={`${record.id}-hist-${index}`}>
                                      <strong>{entry.editorName || 'Admin'}</strong>
                                      {' · '}
                                      {formatDate(entry.editedAt)}
                                      <br />
                                      {entry.changes}
                                    </li>
                                  ))
                                ) : (
                                  <li>No edits yet.</li>
                                )}
                              </ul>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </AdminShell>
  )
}
