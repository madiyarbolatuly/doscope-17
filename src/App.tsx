// App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import Index from './pages/Index';
import TrashBin from './pages/TrashBin';
import { Toaster } from '@/components/ui/toaster';
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
import { PermissionGuard } from './components/PermissionGuard';
import { ProtectedRoute } from './components/ProtectedRoute';
import Favorites from './pages/Favorites';
import SharedDocuments from './pages/SharedDocuments';
import FolderView from './pages/FolderView';
import EditDocumentPage from '@/pages/EditDocument';
import ViewerRedirect from './components/ViewerRedirect';
import { useAuth } from '@/context/AuthContext';

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  // Optional: you can remove this useEffect if you rely purely on <ViewerRedirect />
  useEffect(() => {
    if (!loading && user?.role === 'viewer' && pathname !== '/shared') {
      navigate('/shared', { replace: true });
    }
  }, [user, loading, pathname, navigate]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          {/* everyone can see /shared */}
          <Route path="/shared" element={
            <AppLayout>
              <PermissionGuard pagePath="/shared">
                <SharedDocuments />
              </PermissionGuard>
            </AppLayout>
          } />

          {/* everything else goes through the viewer guard */}
          <Route element={<ViewerRedirect />}>
            <Route path="/" element={<AppLayout><PermissionGuard pagePath="/"><Index/></PermissionGuard></AppLayout>} />
            <Route path="/folder/:folderId" element={<AppLayout><PermissionGuard pagePath="/folder"><FolderView/></PermissionGuard></AppLayout>} />
            <Route path="/document/:documentId" element={<AppLayout><PermissionGuard pagePath="/document"><DocumentDetails/></PermissionGuard></AppLayout>} />
            <Route path="/archived" element={<AppLayout><PermissionGuard pagePath="/archived"><ArchivedPage/></PermissionGuard></AppLayout>} />
            <Route path="/notifications" element={<AppLayout><PermissionGuard pagePath="/notifications"><NotificationsPage/></PermissionGuard></AppLayout>} />
            <Route path="/fileupload" element={<AppLayout><PermissionGuard pagePath="/fileupload"><FileUpload/></PermissionGuard></AppLayout>} />
            <Route path="/usersmanagement" element={<AppLayout><PermissionGuard pagePath="/usersmanagement"><UserManagement/></PermissionGuard></AppLayout>} />
            <Route path="/approvals" element={<AppLayout><PermissionGuard pagePath="/approvals"><Approvals/></PermissionGuard></AppLayout>} />
            <Route path="/settings" element={<AppLayout><PermissionGuard pagePath="/settings"><Settings/></PermissionGuard></AppLayout>} />
            <Route path="/trash" element={<AppLayout><PermissionGuard pagePath="/trash"><TrashBin/></PermissionGuard></AppLayout>} />
            <Route path="/dashboard" element={<AppLayout><PermissionGuard pagePath="/dashboard"><Dashboard/></PermissionGuard></AppLayout>} />
            <Route path="/favorites" element={<AppLayout><PermissionGuard pagePath="/favorites"><Favorites/></PermissionGuard></AppLayout>} />
          </Route>
        </Route>

        <Route path="/edit/:id" element={<EditDocumentPage />} />
        <Route path="*" element={<Navigate to="/shared" replace />} />
      </Routes>

      <Toaster />
    </>
  );
}

export default App;
