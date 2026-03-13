import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SearchProvider } from "@/contexts/SearchContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { BackendStatusProvider } from "@/contexts/BackendStatusContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import DatabasePage from "./pages/DatabasePage";
import UploadPage from "./pages/UploadPage";
import DetectionPage from "./pages/DetectionPage";
import MaskingPage from "./pages/MaskingPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BackendStatusProvider>
        <AuthProvider>
          <SearchProvider>
            <ProjectProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public route - Authentication */}
                  <Route path="/auth" element={<AuthPage />} />
                  
                  {/* Protected routes - require authentication */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/database" element={
                    <ProtectedRoute>
                      <DatabasePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/upload" element={
                    <ProtectedRoute>
                      <UploadPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/detection" element={
                    <ProtectedRoute>
                      <DetectionPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/masking" element={
                    <ProtectedRoute>
                      <MaskingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all route - 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ProjectProvider>
          </SearchProvider>
        </AuthProvider>
      </BackendStatusProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
