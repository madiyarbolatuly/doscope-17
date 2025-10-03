// main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <AuthProvider>
    <Router>
      <App />
    </Router>
  </AuthProvider>
);
