import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "./LoadingSpinner";

export const RedirectLoggedIn = ({ children }) => {
  const { auth, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If user is logged in, redirect based on their role
  if (auth.token) {
    // Redirect admin to admin dashboard
    if (auth.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Redirect regular users to home
    return <Navigate to="/" replace />;
  }

  // If not logged in, show the login/signup form
  return children;
};

export default RedirectLoggedIn;
