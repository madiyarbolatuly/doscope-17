
import React from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-background ">
      <div className="flex flex-1 overflow-hidden ">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 bg-background">
          
          {children}
        </main>
      </div>
    </div>
  );
};
