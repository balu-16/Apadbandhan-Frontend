import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationTrackingProvider } from "@/contexts/LocationTrackingContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import BecomePartner from "./pages/BecomePartner";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import AdminLayout from "./components/admin/AdminLayout";
import { PoliceLayout } from "./components/police";
import { HospitalLayout } from "./components/hospital";
import {
  DashboardHome,
  AddDevice,
  Devices,
  DeviceDetails,
  Settings
} from "./pages/dashboard";
import {
  AdminDashboard,
  UsersManagement,
  AdminsManagement,
  PoliceManagement,
  HospitalManagement,
  AllDevices,
} from "./pages/admin";
import PartnerRequests from "./pages/admin/PartnerRequests";
import AdminSettings from "./pages/admin/AdminSettings";
import { PoliceDashboard } from "./pages/police";
import PoliceSettings from "./pages/police/PoliceSettings";
import { HospitalDashboard } from "./pages/hospital";
import HospitalSettings from "./pages/hospital/HospitalSettings";
import { AlertsPage, UsersReadOnlyPage } from "./pages/shared";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationTrackingProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
          </BrowserRouter>
        </TooltipProvider>
        </LocationTrackingProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
