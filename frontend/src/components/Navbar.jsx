import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setAuth({ token: null, role: null, name: null }); // clear everything
      setIsOpen(false);
      navigate("/");

      toast.success("Logged out successfully 👋");
    } catch (err) {
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = () => setIsOpen(false);

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleLinkClick}
            className="text-2xl font-bold text-indigo-600"
          >
            🎬 CinemaHall
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link
              to="/movies"
              onClick={handleLinkClick}
              className="text-gray-700 hover:text-indigo-600 transition"
            >
              Movies
            </Link>
            <Link
              to="/halls"
              onClick={handleLinkClick}
              className="text-gray-700 hover:text-indigo-600 transition"
            >
              Halls
            </Link>

            {auth.token && auth.role === "user" && (
              <Link
                to="/my-reservations"
                onClick={handleLinkClick}
                className="text-gray-700 hover:text-indigo-600 transition"
              >
                My Reservations
              </Link>
            )}

            {auth.token && auth.role === "admin" && (
              <Link
                to="/admin/dashboard"
                onClick={handleLinkClick}
                className="text-gray-700 hover:text-indigo-600 transition"
              >
                Admin Dashboard
              </Link>
            )}

            {/* Profile for all logged-in users */}
            {auth.token && (
              <Link
                to="/profile"
                onClick={handleLinkClick}
                className="text-gray-700 hover:text-indigo-600 transition"
              >
                Profile
              </Link>
            )}

            {/* Online Greeting */}
            {auth.token && (
              <span className="text-gray-600 flex items-center gap-2">
                <div className="relative">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
                Hi, <span className="font-semibold">{auth.name}</span>
              </span>
            )}
          </div>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex space-x-4">
            {!auth.token ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                  loading
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {loading ? "Logging out..." : "Logout"}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 focus:outline-none"
            >
              {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="space-y-2 p-4">
            <Link
              to="/movies"
              onClick={handleLinkClick}
              className="block text-gray-700 hover:text-indigo-600"
            >
              Movies
            </Link>
            <Link
              to="/halls"
              onClick={handleLinkClick}
              className="block text-gray-700 hover:text-indigo-600"
            >
              Halls
            </Link>

            {auth.token && auth.role === "user" && (
              <Link
                to="/my-reservations"
                onClick={handleLinkClick}
                className="block text-gray-700 hover:text-indigo-600"
              >
                My Reservations
              </Link>
            )}

            {auth.token && auth.role === "admin" && (
              <Link
                to="/admin/dashboard"
                onClick={handleLinkClick}
                className="block text-gray-700 hover:text-indigo-600"
              >
                Admin Dashboard
              </Link>
            )}

            {/* Profile */}
            {auth.token && (
              <Link
                to="/profile"
                onClick={handleLinkClick}
                className="block text-gray-700 hover:text-indigo-600"
              >
                Profile
              </Link>
            )}

            {auth.token && (
              <div className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-full transition-colors duration-200 cursor-pointer border border-blue-100">
                <div className="relative">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
                <p className="font-semibold text-sm">Hi, {auth.name}</p>
              </div>
            )}

            <hr className="my-2" />

            {!auth.token ? (
              <>
                <Link
                  to="/login"
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg text-center"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-white bg-indigo-600 rounded-lg text-center"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                disabled={loading}
                className={`block w-full px-4 py-2 text-white rounded-lg text-center ${
                  loading
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {loading ? "Logging out..." : "Logout"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
