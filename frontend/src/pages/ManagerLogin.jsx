import { Navigate } from 'react-router-dom'

/** Direct manager login URL opens the same in-page modal as the landing login. */
export default function ManagerLogin() {
  return <Navigate to="/?auth=manager" replace />
}
