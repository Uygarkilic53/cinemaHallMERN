import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired on initialization");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("name");
          return { token: null, role: null, name: null };
        }
        // Token is valid, return auth data - prioritize decoded role over stored role
        return {
          token,
          role: decoded.role || role || null,
          name: decoded.name || name || null,
        };
      } catch (err) {
        console.error("Invalid token in storage:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        return { token: null, role: null, name: null };
      }
    }
    return { token: null, role: null, name: null };
  });

  // Set loading to false after initial auth check
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Keep token, role, name in localStorage
  useEffect(() => {
    if (auth.token) {
      localStorage.setItem("token", auth.token);
      localStorage.setItem("role", auth.role || "");
      localStorage.setItem("name", auth.name || "");
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("name");
    }
  }, [auth.token, auth.role, auth.name]);

  // Check token expiration periodically
  useEffect(() => {
    if (!auth.token) return;

    const checkTokenExpiry = () => {
      try {
        const decoded = jwtDecode(auth.token);
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired, logging out");
          setAuth({ token: null, role: null, name: null });
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("name");
        }
      } catch (err) {
        console.error("Error checking token expiry:", err);
        setAuth({ token: null, role: null, name: null });
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);

    return () => clearInterval(interval);
  }, [auth.token]);

  const logout = () => {
    setAuth({ token: null, role: null, name: null });
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
