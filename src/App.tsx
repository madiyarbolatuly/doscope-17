
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import TrashBin from './pages/TrashBin';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import Login from './pages/Login';
import { AppLayout } from './components/AppLayout';
import ArchivedPage from './pages/ArchivedPage';
import NotificationsPage from './pages/NotificationsPage';
import FileUpload from './pages/FileUpload';
import UserManagement from './pages/UserManagement';
import Approvals from './pages/Approvals';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import DocumentDetails from './pages/DocumentDetails';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import { PermissionGuard } from './components/PermissionGuard';
import { ProtectedRoute } from './components/ProtectedRoute';
import Favorites from './pages/Favorites';
import SharedDocuments from './pages/SharedDocuments';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route - Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes - All other routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={
              <AppLayout>
                <PermissionGuard pagePath="/">
                  <Index />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/shared" element={
              <AppLayout>
                <PermissionGuard pagePath="/shared">
                  <SharedDocuments />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/archived" element={
              <AppLayout>
                <PermissionGuard pagePath="/archived">
                  <ArchivedPage />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/notifications" element={
              <AppLayout>
                <PermissionGuard pagePath="/notifications">
                  <NotificationsPage />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/fileupload" element={
              <AppLayout>
                <PermissionGuard pagePath="/fileupload">
                  <FileUpload />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/usersmanagement" element={
              <AppLayout>
                <PermissionGuard pagePath="/usersmanagement">
                  <UserManagement />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/approvals" element={
              <AppLayout>
                <PermissionGuard pagePath="/approvals">
                  <Approvals />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/settings" element={
              <AppLayout>
                <PermissionGuard pagePath="/settings">
                  <Settings />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/notfound" element={<AppLayout><NotFound /></AppLayout>} />
            <Route path="/documentdetails" element={<AppLayout><DocumentDetails /></AppLayout>} />
            <Route path="/trash" element={
              <AppLayout>
                <PermissionGuard pagePath="/trash">
                  <TrashBin />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/dashboard" element={
              <AppLayout>
                <PermissionGuard pagePath="/dashboard">
                  <Dashboard />
                </PermissionGuard>
              </AppLayout>
            } />
            <Route path="/favorites" element={
              <AppLayout>
                <PermissionGuard pagePath="/favorites">
                  <Favorites />
                </PermissionGuard>
              </AppLayout>
            } />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
