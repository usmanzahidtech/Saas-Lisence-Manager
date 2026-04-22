import { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';
import "./App.css";
// Lazy Load Components
const Login = lazy(() => import('./components/auth/Login'));
const SuperAdminDashboard = lazy(() => import('./components/dashboard/SuperAdminDashboard'));
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard'));
const UserDashboard = lazy(() => import('./components/dashboard/UserDashboard'));
const CreateUser = lazy(() => import('./components/users/CreateUser'));
const UserList = lazy(() => import('./components/users/UserList'));
const EditUser = lazy(() => import('./components/users/EditUser'));
const AuditLogs = lazy(() => import('./components/users/AuditLogs'));
const CompaniesList = lazy(() => import('./components/companies/CompaniesList'));
const CreateCompany = lazy(() => import('./components/companies/CreateCompany'));
const EditCompany = lazy(() => import('./components/companies/EditCompany'));
const UserActivity = lazy(() => import('./components/users/UserActivity'));
const UserNotifications = lazy(() => import('./components/users/UserNotifications'));
const UserHelp = lazy(() => import('./components/users/UserHelp'));

// Dashboard Router Component
const DashboardRouter = () => {
  const { userRole } = useAuth();

  if (userRole === 'super_admin') {
    return <SuperAdminDashboard />;
  } else if (userRole === 'admin') {
    return <AdminDashboard />;
  } else if (userRole === 'user') {
    return <UserDashboard />;
  }

  return <LoadingSpinner />;
};

// Main Layout with Sidebar
const MainLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <main 
        className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
};

// Settings Placeholder
const Settings = () => {
  return (
    <div className="p-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Settings</h1>
        <p className="text-gray-600">System settings and configuration options will be available here.</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DashboardRouter />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                    <MainLayout>
                      <UserList />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users/create"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                    <MainLayout>
                      <CreateUser />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                    <MainLayout>
                      <EditUser />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/companies"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <MainLayout>
                      <CompaniesList />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/companies/create"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <MainLayout>
                      <CreateCompany />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/companies/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <MainLayout>
                      <EditCompany />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <MainLayout>
                      <AuditLogs />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* User-specific Routes */}
              <Route
                path="/activity"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <MainLayout>
                      <UserActivity />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <MainLayout>
                      <UserNotifications />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/help"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <MainLayout>
                      <UserHelp />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
