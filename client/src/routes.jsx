import { Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";

function resolveRole(user) {
  if (!user) return (localStorage.getItem("role") || "").toString().toLowerCase();

  // common shapes: { role }, { user: { role } }, { data: { role } }
  const maybeRole =
    user.role ||
    (user.user && user.user.role) ||
    (user.data && user.data.role) ||
    localStorage.getItem("role");

  return (maybeRole || "").toString().toLowerCase();
}

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export function StaffRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const role = resolveRole(user);
  if (role !== "staff" && role !== "admin") {
    return <Navigate to="/error/403" replace />;
  }
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const role = resolveRole(user);
  if (role !== "admin") {
    return <Navigate to="/error/403" replace />;
  }
  return children;
}

export default PrivateRoute;
