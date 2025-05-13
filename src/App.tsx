
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import { Toaster } from "@/components/ui/toaster";
import { withAuth } from '@/hoc/withAuth';

// Protected component with authentication
const ProtectedIndex = withAuth(Index);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedIndex />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
