import { Link } from 'react-router-dom'

const LOGO_SRC = '/nexo%20logo.png'

export default function BrandLogo({
  to = '/',
  className = '',
  alt = 'Nexora Bizworks',
  size = 'md',
}) {
  const sizeClass =
    size === 'lg' ? 'brand-logo--lg' : size === 'sm' ? 'brand-logo--sm' : 'brand-logo--md'

  const image = (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={`brand-logo ${sizeClass} ${className}`.trim()}
    />
  )

  if (!to) {
    return image
  }

  return (
    <Link
      to={to}
      className="brand-logo-link"
      aria-label={alt}
      onClick={() => {
        if (to === '/') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        }
      }}
    >
      {image}
    </Link>
  )
}
