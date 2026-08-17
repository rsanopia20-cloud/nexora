import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import { AuthProvider } from './context/AuthContext'
import About from './pages/About'
import AdminDashboard from './pages/AdminDashboard'
import AdminLinkDetail from './pages/AdminLinkDetail'
import AdminLinks from './pages/AdminLinks'
import AdminUserDetail from './pages/AdminUserDetail'
import AdminUsers from './pages/AdminUsers'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Services from './pages/Services'
import Signup from './pages/Signup'
import Terms from './pages/Terms'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/welcome" element={<Navigate to="/dashboard" replace />} />
          {/* TODO: Protect /admin/* with admin-only auth before production. */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/links" element={<AdminLinks />} />
          <Route path="/admin/links/:linkId" element={<AdminLinkDetail />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
