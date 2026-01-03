import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationTrackingProvider } from "@/contexts/LocationTrackingContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LocationPermissionModal } from "@/components/LocationPermissionModal";
import { Loader2 } from "lucide-react";

// Eager-loaded pages (critical path - landing, auth)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages (code splitting for better initial bundle size)
const BecomePartner = lazy(() => import("./pages/BecomePartner"));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));

// Lazy-loaded dashboard pages
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const AddDevice = lazy(() => import("./pages/dashboard/AddDevice"));
const Devices = lazy(() => import("./pages/dashboard/Devices"));
const DeviceDetails = lazy(() => import("./pages/dashboard/DeviceDetails"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const UserAlertsPage = lazy(() => import("./pages/dashboard/UserAlertsPage"));

// Lazy-loaded admin pages (separate chunk for admin portal)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const AdminsManagement = lazy(() => import("./pages/admin/AdminsManagement"));
const PoliceManagement = lazy(() => import("./pages/admin/PoliceManagement"));
const HospitalManagement = lazy(() => import("./pages/admin/HospitalManagement"));
const AllDevices = lazy(() => import("./pages/admin/AllDevices"));
const PartnerRequests = lazy(() => import("./pages/admin/PartnerRequests"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const NotificationCenter = lazy(() => import("./pages/admin/NotificationCenter"));

// Lazy-loaded police pages
const PoliceLayout = lazy(() => import("./components/police/PoliceLayout"));
const PoliceDashboard = lazy(() => import("./pages/police/PoliceDashboard"));
const PoliceSettings = lazy(() => import("./pages/police/PoliceSettings"));

// Lazy-loaded hospital pages
const HospitalLayout = lazy(() => import("./components/hospital/HospitalLayout"));
const HospitalDashboard = lazy(() => import("./pages/hospital/HospitalDashboard"));
const HospitalSettings = lazy(() => import("./pages/hospital/HospitalSettings"));

// Lazy-loaded shared pages
const AlertsPage = lazy(() => import("./pages/shared/AlertsPage"));
const UsersReadOnlyPage = lazy(() => import("./pages/shared/UsersReadOnlyPage"));

// Loading spinner component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationTrackingProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <LocationPermissionModal />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes - Redirect to dashboard if logged in */}
                {/* Once logged in, users cannot access landing/home/auth pages until logout */}
                <Route element={<PublicRoute restricted={true} />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/login" element={<Auth />} />
                  <Route path="/signup" element={<Auth />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/become-partner" element={<BecomePartner />} />
                </Route>

                {/* Protected Dashboard Routes (Regular users only) */}
                <Route element={<ProtectedRoute requiredRole="user" unauthorizedRedirect="/login" />}>
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<DashboardHome />} />
                    <Route path="add-device" element={<AddDevice />} />
                    <Route path="devices" element={<Devices />} />
                    <Route path="devices/:id" element={<DeviceDetails />} />
                    <Route path="alerts" element={<UserAlertsPage />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Protected Admin Routes (Admin or SuperAdmin) */}
                <Route element={<ProtectedRoute requiredRole={['admin', 'superadmin']} unauthorizedRedirect="/dashboard" />}>
                  <Route path="/admin" element={<AdminLayout basePath="/admin" requiredRole="admin" />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="devices" element={<AllDevices />} />
                    <Route path="requests" element={<PartnerRequests />} />
                    <Route path="alerts" element={<AlertsPage portalType="admin" />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Route>

                {/* Protected SuperAdmin Routes (SuperAdmin only) */}
                <Route element={<ProtectedRoute requiredRole="superadmin" unauthorizedRedirect="/dashboard" />}>
                  <Route path="/superadmin" element={<AdminLayout basePath="/superadmin" requiredRole="superadmin" />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="admins" element={<AdminsManagement />} />
                    <Route path="police" element={<PoliceManagement />} />
                    <Route path="hospitals" element={<HospitalManagement />} />
                    <Route path="devices" element={<AllDevices />} />
                    <Route path="requests" element={<PartnerRequests />} />
                    <Route path="alerts" element={<AlertsPage portalType="superadmin" />} />
                    <Route path="notifications" element={<NotificationCenter />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Route>

                {/* Protected Police Routes */}
                <Route element={<ProtectedRoute requiredRole="police" unauthorizedRedirect="/dashboard" />}>
                  <Route path="/police" element={<PoliceLayout />}>
                    <Route index element={<PoliceDashboard />} />
                    <Route path="users" element={<UsersReadOnlyPage portalType="police" />} />
                    <Route path="alerts" element={<AlertsPage portalType="police" />} />
                    <Route path="settings" element={<PoliceSettings />} />
                  </Route>
                </Route>

                {/* Protected Hospital Routes */}
                <Route element={<ProtectedRoute requiredRole="hospital" unauthorizedRedirect="/dashboard" />}>
                  <Route path="/hospital" element={<HospitalLayout />}>
                    <Route index element={<HospitalDashboard />} />
                    <Route path="users" element={<UsersReadOnlyPage portalType="hospital" />} />
                    <Route path="alerts" element={<AlertsPage portalType="hospital" />} />
                    <Route path="settings" element={<HospitalSettings />} />
                  </Route>
                </Route>

                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
        </LocationTrackingProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
