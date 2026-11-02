import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Gate for authenticated routes — redirects to /login when unauthenticated. */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Avoid a redirect flash while the session is being restored
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
