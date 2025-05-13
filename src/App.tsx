
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout><Index /></AppLayout>} />
          <Route path="/trash" element={<AppLayout><TrashBin /></AppLayout>} />
          <Route path="/archived" element={<AppLayout><ArchivedPage /></AppLayout>} />
          <Route path="/notifications" element={<AppLayout><NotificationsPage /></AppLayout>} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
