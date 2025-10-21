import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NotFound from "./components/NotFound.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/Signup.jsx";
import MovieDetail from "./pages/MovieDetails.jsx";
import Reservation from "./pages/Reservation.jsx";
import MyReservations from "./pages/MyReservations.jsx";
import Movies from "./pages/Movies.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Profile from "./pages/ViewProfile.jsx";
import Dashboard from "./pages/Admin/Dashboard.jsx";
import ManageMovies from "./pages/Admin/ManageMovies.jsx";
import ManageHalls from "./pages/Admin/ManageHalls.jsx";
import ManageReservations from "./pages/Admin/ManageReservations.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RedirectLoggedIn from "./components/RedirectLoggedIn.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-16">
          <ToastContainer position="top-center" autoClose={1000} />
          <Routes>
            <Route path="/" element={<Movies />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Redirect logged-in users from login/signup */}
            <Route
              path="/login"
              element={
                <RedirectLoggedIn>
                  <Login />
                </RedirectLoggedIn>
              }
            />
            <Route
              path="/signup"
              element={
                <RedirectLoggedIn>
                  <SignUp />
                </RedirectLoggedIn>
              }
            />

            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/movies" element={<Movies />} />

            {/* Protected routes */}
            <Route
              path="/reservation/:id"
              element={
                <ProtectedRoute>
                  <Reservation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-reservations"
              element={
                <ProtectedRoute>
                  <MyReservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin-only routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/managemovies"
              element={
                <AdminRoute>
                  <ManageMovies />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/managereservations"
              element={
                <AdminRoute>
                  <ManageReservations />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/managehalls"
              element={
                <AdminRoute>
                  <ManageHalls />
                </AdminRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
