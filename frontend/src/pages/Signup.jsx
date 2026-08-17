import { Navigate } from 'react-router-dom'

/** Deep-link compatibility: /signup opens the home modal */
export default function Signup() {
  return <Navigate to="/?auth=signup" replace />
}
