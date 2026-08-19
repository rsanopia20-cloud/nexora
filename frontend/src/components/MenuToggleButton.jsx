export default function MenuToggleButton({ open, onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.35rem] border border-mist bg-transparent ${className}`.trim()}
      aria-expanded={open}
      aria-label={open ? 'Close menu' : 'Open menu'}
      onClick={onClick}
    >
      <span
        className={`absolute block h-0.5 w-[1.15rem] rounded-sm bg-ink transition-transform duration-200 ease-out ${
          open ? 'rotate-45' : '-translate-y-[5px]'
        }`}
      />
      <span
        className={`absolute block h-0.5 w-[1.15rem] rounded-sm bg-ink transition-opacity duration-150 ${
          open ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <span
        className={`absolute block h-0.5 w-[1.15rem] rounded-sm bg-ink transition-transform duration-200 ease-out ${
          open ? '-rotate-45' : 'translate-y-[5px]'
        }`}
      />
    </button>
  )
}
