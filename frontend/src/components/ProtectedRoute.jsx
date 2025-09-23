import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export const ProtectedRoute = ({ children }) => {
  const { auth, isLoading } = useAuth();

  // Show loading spinner or nothing while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check if user is not logged in
  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
