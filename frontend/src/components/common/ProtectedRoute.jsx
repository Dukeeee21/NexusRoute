import { Navigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";

/**
 * Guards a route. Redirects to /login when unauthenticated, and to the
 * user's own area when their role does not match the required `role`.
 */
export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    const home = user.role === "ADMIN" ? "/admin" : "/driver";
    return <Navigate to={home} replace />;
  }

  return children;
}
