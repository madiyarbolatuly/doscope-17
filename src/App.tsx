
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/UserManagement";
import Dashboard from "./pages/Dashboard";
import DocumentDetails from "./pages/DocumentDetails";
import TrashBin from "./pages/TrashBin";
import Auth from "./pages/Auth";
import FileUpload from "./pages/FileUpload";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/document/:id" element={<DocumentDetails />} />
              <Route path="/upload" element={<FileUpload />} />
              <Route path="/trash" element={<TrashBin />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
