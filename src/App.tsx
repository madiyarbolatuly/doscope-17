
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import TrashBin from './pages/TrashBin';
import { Toaster } from "@/components/ui/toaster";
import { withAuth } from '@/hoc/withAuth';
import { AuthProvider } from '@/context/AuthContext';
import Login from './pages/Login';

// Protected components with authentication
const ProtectedIndex = withAuth(Index);
const ProtectedTrashBin = withAuth(TrashBin);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedIndex />} />
          <Route path="/trash" element={<ProtectedTrashBin />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
