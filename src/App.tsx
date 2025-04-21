
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/UserManagement";
import Dashboard from "./pages/Dashboard";
import DocumentDetails from "./pages/DocumentDetails";
import TrashBin from "./pages/TrashBin";
import Auth from "./pages/Auth";
import FileUpload from "./pages/FileUpload";
import Documents from "./pages/Documents";
import Approvals from "./pages/Approvals";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Auth />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/document/:id" element={<DocumentDetails />} />
                <Route path="/upload" element={<FileUpload />} />
                <Route path="/trash" element={<TrashBin />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
