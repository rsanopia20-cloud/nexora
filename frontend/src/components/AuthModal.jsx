import { useEffect } from 'react'

export default function AuthModal({ open, title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="auth-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
      role="presentation"
    >
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="auth-modal-title">{title}</h2>
        {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
        {children}
        {footer}
      </div>
    </div>
  )
}
