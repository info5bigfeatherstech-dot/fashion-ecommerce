import { Navigate } from 'react-router-dom'

/** Legacy path — account profile lives at /account/profile */
export default function Profile() {
  return <Navigate to="/account/profile" replace />
}
