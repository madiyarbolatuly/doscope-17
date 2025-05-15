
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout><Index /></AppLayout>} />
        
          <Route path="/archived" element={<AppLayout><ArchivedPage /></AppLayout>} />
          <Route path="/notifications" element={<AppLayout><NotificationsPage /></AppLayout>} />
          <Route path="/fileupload" element={<AppLayout><FileUpload /></AppLayout>} />
          <Route path="/usersmanagement" element={<AppLayout><UserManagement /></AppLayout>} />
          <Route path="/approvals" element={<AppLayout><Approvals /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="/notfound" element={<AppLayout><NotFound /></AppLayout>} />
          <Route path="/documentdetails" element={<AppLayout><DocumentDetails /></AppLayout>} />
          <Route path="/trash" element={<AppLayout><TrashBin /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />

         
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
