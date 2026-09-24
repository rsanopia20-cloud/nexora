import { Navigate, useSearchParams } from 'react-router-dom'

/** Email links land on the home page with the reset popup open. */
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const target = token
    ? `/?auth=reset&token=${encodeURIComponent(token)}`
    : '/?auth=forgot'

  return <Navigate to={target} replace />
}
