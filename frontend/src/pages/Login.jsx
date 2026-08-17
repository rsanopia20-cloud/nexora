import { Navigate } from 'react-router-dom'

/** Deep-link compatibility: /login opens the home modal */
export default function Login() {
  return <Navigate to="/?auth=login" replace />
}
