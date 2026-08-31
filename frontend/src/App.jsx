import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AuthProvider } from './context/AuthContext'
import About from './pages/About'
import AdminDashboard from './pages/AdminDashboard'
import AdminConversionCustomerDetail from './pages/AdminConversionCustomerDetail'
import AdminConversions from './pages/AdminConversions'
import AdminConversionUpload from './pages/AdminConversionUpload'
import AdminLinkDetail from './pages/AdminLinkDetail'
import AdminLinks from './pages/AdminLinks'
import AdminUserDetail from './pages/AdminUserDetail'
import AdminUsers from './pages/AdminUsers'
import AdminUnmatchedConversions from './pages/AdminUnmatchedConversions'
import AdminManualBatches from './pages/AdminManualBatches'
import AdminManualBatchReview from './pages/AdminManualBatchReview'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Privacy from './pages/Privacy'
import Services from './pages/Services'
import Signup from './pages/Signup'
import Terms from './pages/Terms'
import ComplianceTransparency from './pages/ComplianceTransparency'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/compliance-transparency" element={<ComplianceTransparency />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/welcome" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/links"
              element={
                <AdminProtectedRoute>
                  <AdminLinks />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/links/:linkId"
              element={
                <AdminProtectedRoute>
                  <AdminLinkDetail />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminProtectedRoute>
                  <AdminUsers />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/conversions"
              element={
                <AdminProtectedRoute>
                  <AdminConversions />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/conversions/upload"
              element={
                <AdminProtectedRoute>
                  <AdminConversionUpload />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/conversions/unmatched"
              element={
                <AdminProtectedRoute>
                  <AdminUnmatchedConversions />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/conversions/manual"
              element={
                <AdminProtectedRoute>
                  <AdminManualBatches />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/conversions/manual/:batchId"
              element={
                <AdminProtectedRoute>
                  <AdminManualBatchReview />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/conversions/:userId"
              element={
                <AdminProtectedRoute>
                  <AdminConversionCustomerDetail />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/users/:userId"
              element={
                <AdminProtectedRoute>
                  <AdminUserDetail />
                </AdminProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App
