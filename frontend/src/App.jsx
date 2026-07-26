import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import Login from "./pages/auth/Login.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Deliveries from "./pages/admin/Deliveries.jsx";
import Vehicles from "./pages/admin/Vehicles.jsx";
import RoutesPage from "./pages/admin/Routes.jsx";
import Reports from "./pages/admin/Reports.jsx";
import Settings from "./pages/admin/Settings.jsx";
import Support from "./pages/admin/Support.jsx";
import DriverView from "./pages/driver/DriverView.jsx";
import { ROLES } from "./utils/constants.js";

/**
 * Top-level routing. Admins land on the dashboard, drivers on their
 * route view. Both areas are guarded by ProtectedRoute (Phase 1 wires
 * auth; the inner screens are fleshed out in later phases).
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/deliveries"
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Deliveries />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/vehicles"
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Vehicles />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/routes"
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <RoutesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/support"
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Support />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/*"
        element={
          <ProtectedRoute role={ROLES.DRIVER}>
            <DriverView />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
