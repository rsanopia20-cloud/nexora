import { useState } from 'react'

function EyeIcon({ open }) {
  // Outline-style icons (common web pattern)
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.8" />
      <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6 0 9.5 7 9.5 7a17.4 17.4 0 0 1-3.2 3.9" />
      <path d="M6.1 6.1A17.5 17.5 0 0 0 2.5 12s3.5 7 9.5 7c1.2 0 2.3-.2 3.3-.6" />
    </svg>
  )
}

export default function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  disabled = false,
  error,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-field">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          disabled={disabled}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error ? <em>{error}</em> : null}
    </label>
  )
}
