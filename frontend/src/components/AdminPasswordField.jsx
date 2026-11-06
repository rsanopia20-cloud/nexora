import { useState } from 'react'

function EyeIcon({ off }) {
  if (off) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M3 3l18 18M10.5 10.7A2 2 0 0 0 13.3 13.5M9.9 5.2A10.4 10.4 0 0 1 12 5c5.2 0 8.8 4.2 10 7-.4.9-1.1 2-2.1 3.1M6.1 6.3C4.2 7.6 2.8 9.5 2 12c1.2 2.8 4.8 7 10 7 1.6 0 3-.3 4.3-.9"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M2 12c1.2-2.8 4.8-7 10-7s8.8 4.2 10 7c-1.2 2.8-4.8 7-10 7s-8.8-4.2-10-7Z"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function AdminPasswordField({
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  disabled = false,
  autoComplete = 'new-password',
}) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="admin-password-field">
      <input
        className="admin-search"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        disabled={disabled}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="admin-password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((open) => !open)}
        disabled={disabled}
      >
        <EyeIcon off={visible} />
      </button>
    </span>
  )
}
