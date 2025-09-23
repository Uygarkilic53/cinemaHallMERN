import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "./LoadingSpinner";

export const AdminRoute = ({ children }) => {
  const { auth, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check if user is not logged in
  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is not admin
  if (auth.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
