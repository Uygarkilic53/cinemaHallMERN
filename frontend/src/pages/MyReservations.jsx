import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const RESERVATIONS_PER_PAGE = 6;

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await api.get("/reservations/my-reservations");
      setReservations(response.data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error(
        error.response?.data?.message || "Failed to load reservations"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this reservation? This action cannot be undone."
      )
    ) {
      return;
    }

    setCancellingId(id);
    try {
      const response = await api.post(`/reservations/cancel-reservation/${id}`);

      setReservations((prev) =>
        prev.map((reservation) =>
          reservation._id === id
            ? { ...reservation, status: "cancelled" }
            : reservation
        )
      );

      toast.success(
        response.data?.message ||
          "Reservation cancelled successfully. Your refund will be processed shortly."
      );
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to cancel reservation. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (reservation) => {
    if (reservation.status !== "reserved") return false;

    const now = new Date();
    const showtimeDate = new Date(reservation.showtimeDate);

    const [hours, minutes] = reservation.showtime.includes(":")
      ? reservation.showtime
          .split(":")
          .map((t) => parseInt(t.replace(/\D/g, "")))
      : [0, 0];

    showtimeDate.setHours(hours, minutes, 0, 0);
    const timeDifferenceInMinutes = (showtimeDate - now) / (1000 * 60);

    return timeDifferenceInMinutes > 5;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "reserved":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatSeats = (seats) => {
    return seats.map((seat) => `${seat.row}${seat.number}`).join(", ");
  };

  // Pagination calculations
  const totalPages = Math.ceil(reservations.length / RESERVATIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESERVATIONS_PER_PAGE;
  const endIndex = startIndex + RESERVATIONS_PER_PAGE;
  const currentReservations = reservations.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return <LoadingSpinner message="Loading your reservations..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reservations</h1>
          {reservations.length > 0 && (
            <p className="text-gray-600">
              Total: {reservations.length} reservation
              {reservations.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reservations found
            </h3>
            <p className="text-gray-500">
              You haven't made any movie reservations yet.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {currentReservations.map((reservation) => (
                <div
                  key={reservation._id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {reservation.movie.posterPath ? (
                          <img
                            src={`${TMDB_IMAGE_BASE}${reservation.movie.posterPath}`}
                            alt={reservation.movie.title}
                            className="w-full h-60 object-cover"
                          />
                        ) : (
                          <div className="w-full h-60 bg-gray-200 flex items-center justify-center text-gray-500">
                            No Image Available
                          </div>
                        )}
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {reservation.movie?.title || "Movie Title"}
                        </h3>
                        <p className="text-gray-600">
                          {reservation.hall?.name || "Hall Name"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                          reservation.status
                        )}`}
                      >
                        {reservation.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center text-gray-700">
                        <svg
                          className="w-5 h-5 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 10a2 2 0 002 2h6a2 2 0 002-2L16 7"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">Date</p>
                          <p className="text-sm">
                            {formatDate(reservation.showtimeDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-700">
                        <svg
                          className="w-5 h-5 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">Time</p>
                          <p className="text-sm">{reservation.showtime}</p>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-700">
                        <svg
                          className="w-5 h-5 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">Seats</p>
                          <p className="text-sm">
                            {formatSeats(reservation.seats)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Booked on{" "}
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </div>

                      {canCancel(reservation) && (
                        <button
                          onClick={() =>
                            handleCancelReservation(reservation._id)
                          }
                          disabled={cancellingId === reservation._id}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {cancellingId === reservation._id ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Cancelling...
                            </span>
                          ) : (
                            "Cancel Reservation"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex space-x-1">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === "number" && goToPage(page)}
                      disabled={page === "..."}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        page === currentPage
                          ? "bg-blue-600 text-white"
                          : page === "..."
                          ? "bg-transparent text-gray-400 cursor-default"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Page Info */}
            {totalPages > 1 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, reservations.length)} of{" "}
                {reservations.length} reservations
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyReservations;
