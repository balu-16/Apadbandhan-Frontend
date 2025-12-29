import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  /**
   * Required role(s) to access this route.
   * If not specified, any authenticated user can access.
   * Can be a single role or an array of allowed roles.
   */
  requiredRole?: UserRole | UserRole[];
  
  /**
   * Path to redirect to if not authenticated.
   * Defaults to '/login'
   */
  redirectTo?: string;
  
  /**
   * Path to redirect to if authenticated but doesn't have the required role.
   * Defaults to '/dashboard'
   */
  unauthorizedRedirect?: string;
  
  /**
   * Children to render instead of Outlet (for wrapping specific components).
   * If not provided, Outlet will be rendered for nested routes.
   */
  children?: React.ReactNode;
}

/**
 * Loading Spinner Component
 */
const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-muted-foreground text-sm">Verifying authentication...</p>
    </div>
  </div>
);

/**
 * Get the appropriate dashboard path based on user role
 */
const getDashboardByRole = (role: UserRole | null): string => {
  switch (role) {
    case 'superadmin':
      return '/superadmin';
    case 'admin':
      return '/admin';
    case 'police':
      return '/police';
    case 'hospital':
      return '/hospital';
    default:
      return '/dashboard';
  }
};

/**
 * ProtectedRoute Component
 * 
 * A reusable route protection component for React Router v6.
 * - Checks authentication status from AuthContext
 * - Supports role-based access control
 * - Shows loading spinner while checking auth
 * - Redirects to login if not authenticated
 * - Preserves the intended destination for redirect after login
 * 
 * @example
 * // Basic protection - any authenticated user
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 * 
 * @example
 * // Role-based protection - admin only
 * <Route element={<ProtectedRoute requiredRole="admin" />}>
 *   <Route path="/admin" element={<AdminPanel />} />
 * </Route>
 * 
 * @example
 * // Multiple roles allowed
 * <Route element={<ProtectedRoute requiredRole={['admin', 'superadmin']} />}>
 *   <Route path="/management" element={<Management />} />
 * </Route>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  redirectTo = '/login',
  unauthorizedRedirect = '/dashboard',
  children,
}) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  // Preserve the current location so we can redirect back after login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Check if user's role is in the allowed roles
    const hasRequiredRole = userRole && allowedRoles.includes(userRole);
    
    // Special case: superadmin can access admin routes
    const isSuperAdminAccessingAdminRoute = 
      userRole === 'superadmin' && allowedRoles.includes('admin');
    
    if (!hasRequiredRole && !isSuperAdminAccessingAdminRoute) {
      // User is authenticated but doesn't have the required role
      // Redirect to their appropriate dashboard based on role
      const roleBasedRedirect = getDashboardByRole(userRole);
      return <Navigate to={roleBasedRedirect} replace />;
    }
  }

  // User is authenticated (and has required role if specified)
  // Render children if provided, otherwise render Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

interface PublicRouteProps {
  /**
   * Children to render instead of Outlet (for wrapping specific components).
   * If not provided, Outlet will be rendered for nested routes.
   */
  children?: React.ReactNode;
  
  /**
   * If true, authenticated users will be redirected to their dashboard.
   * Defaults to true - use this for login/signup pages.
   */
  restricted?: boolean;
}

/**
 * PublicRoute Component
 * 
 * A route wrapper for public pages that should NOT be accessible when authenticated.
 * Perfect for login, signup, and other auth pages.
 * 
 * When a user is already logged in and tries to access these pages:
 * - They will be automatically redirected to their role-appropriate dashboard
 * - This prevents the "back button to login" issue
 * 
 * @example
 * // Login page - redirect authenticated users away
 * <Route element={<PublicRoute restricted />}>
 *   <Route path="/login" element={<Login />} />
 * </Route>
 * 
 * @example
 * // Public page accessible to everyone (like landing page)
 * <Route element={<PublicRoute restricted={false} />}>
 *   <Route path="/" element={<LandingPage />} />
 * </Route>
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restricted = true,
}) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If restricted and user is authenticated, redirect to appropriate dashboard
  if (restricted && isAuthenticated) {
    const redirectPath = getDashboardByRole(userRole);
    return <Navigate to={redirectPath} replace />;
  }

  // Not authenticated or not restricted - render the public page
  return children ? <>{children}</> : <Outlet />;
};

// Default export for backward compatibility
export default ProtectedRoute;

