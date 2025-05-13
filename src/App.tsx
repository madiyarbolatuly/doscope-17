
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import TrashBin from './pages/TrashBin';
import { Toaster } from "@/components/ui/toaster";
import { withAuth } from '@/hoc/withAuth';

// Protected components with authentication
const ProtectedIndex = withAuth(Index);
const ProtectedTrashBin = withAuth(TrashBin);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedIndex />} />
        <Route path="/trash" element={<ProtectedTrashBin />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
