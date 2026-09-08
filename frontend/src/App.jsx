import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import ManagerProtectedRoute from './components/ManagerProtectedRoute'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AuthProvider } from './context/AuthContext'
import { ManagerAuthProvider } from './context/ManagerAuthContext'
import About from './pages/About'
import AdminDashboard from './pages/AdminDashboard'
import AdminConversionCustomerDetail from './pages/AdminConversionCustomerDetail'
import AdminConversions from './pages/AdminConversions'
import AdminConversionUpload from './pages/AdminConversionUpload'
import AdminLinkDetail from './pages/AdminLinkDetail'
import AdminLinks from './pages/AdminLinks'
import AdminManagerDetail from './pages/AdminManagerDetail'
import AdminManagerEarnings from './pages/AdminManagerEarnings'
import AdminManagerEarningsDetail from './pages/AdminManagerEarningsDetail'
import AdminManagers from './pages/AdminManagers'
import AdminUserDetail from './pages/AdminUserDetail'
import AdminUsers from './pages/AdminUsers'
import AdminManualBatches from './pages/AdminManualBatches'
import AdminManualBatchReview from './pages/AdminManualBatchReview'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ManagerDashboard from './pages/ManagerDashboard'
import ManagerLogin from './pages/ManagerLogin'
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
        <ManagerAuthProvider>
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
              <Route path="/manager/login" element={<ManagerLogin />} />
              <Route
                path="/manager"
                element={
                  <ManagerProtectedRoute>
                    <ManagerDashboard />
                  </ManagerProtectedRoute>
                }
              />
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
                path="/admin/managers"
                element={
                  <AdminProtectedRoute>
                    <AdminManagers />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/managers/:managerId"
                element={
                  <AdminProtectedRoute>
                    <AdminManagerDetail />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/manager-earnings"
                element={
                  <AdminProtectedRoute>
                    <AdminManagerEarnings />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/manager-earnings/:managerId"
                element={
                  <AdminProtectedRoute>
                    <AdminManagerEarningsDetail />
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
        </ManagerAuthProvider>
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App
