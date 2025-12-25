import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import AdminLayout from "./components/admin/AdminLayout";
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
  AllDevices,
} from "./pages/admin";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
              </Route>

              {/* Protected Dashboard Routes (Any authenticated user) */}
              <Route element={<ProtectedRoute />}>
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
                </Route>
              </Route>

              {/* Protected SuperAdmin Routes (SuperAdmin only) */}
              <Route element={<ProtectedRoute requiredRole="superadmin" unauthorizedRedirect="/dashboard" />}>
                <Route path="/superadmin" element={<AdminLayout basePath="/superadmin" requiredRole="superadmin" />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="admins" element={<AdminsManagement />} />
                  <Route path="devices" element={<AllDevices />} />
                </Route>
              </Route>

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
