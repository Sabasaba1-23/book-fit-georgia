import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import NetworkStatus from "@/components/NetworkStatus";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Home from "./pages/Home";
import InAppBrowserBanner from "@/components/InAppBrowserBanner";

// Lazy-loaded routes for code splitting
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Messages = lazy(() => import("./pages/Messages"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PartnerProfile = lazy(() => import("./pages/PartnerProfile"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminListings = lazy(() => import("./pages/admin/AdminListings"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminBadges = lazy(() => import("./pages/admin/AdminBadges"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const Payment = lazy(() => import("./pages/Payment"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const SuspenseFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NetworkStatus />
          <InAppBrowserBanner />
          <BrowserRouter>
            <Suspense fallback={<SuspenseFallback />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Home />} />
                <Route path="/partner/:id" element={<PartnerProfile />} />
                <Route path="/partner/dashboard" element={<ProtectedRoute><PartnerDashboard /></ProtectedRoute>} />
                <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                
                {/* Admin routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="listings" element={<AdminListings />} />
                  <Route path="partners" element={<AdminPartners />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="badges" element={<AdminBadges />} />
                </Route>

                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
