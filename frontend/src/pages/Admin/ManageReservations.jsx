import { useState, useEffect } from "react";
import {
  FiSearch,
  FiCalendar,
  FiUser,
  FiFilm,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiAlertCircle,
  FiDollarSign,
} from "react-icons/fi";
import { MdEventSeat } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../services/api";

const ManageReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    reservationId: null,
  });
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservationsList();
  }, [reservations, searchTerm, filterStatus]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/reservations/get-reservations");
      console.log("Reservations data:", response.data); // Debug log
      setReservations(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch reservations. Please try again.");
      console.error("Error fetching reservations:", err);
      toast.error("Failed to fetch reservations");
    } finally {
      setLoading(false);
    }
  };

  const filterReservationsList = () => {
    let filtered = [...reservations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (reservation) =>
          reservation.user?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reservation.user?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reservation.movie?.title
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reservation.hall?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (reservation) => reservation.status === filterStatus
      );
    }

    setFilteredReservations(filtered);
    setCurrentPage(1);
  };

  const handleDeleteClick = (reservationId) => {
    setDeleteModal({ show: true, reservationId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.reservationId) return;

    try {
      setDeleting(true);
      await api.delete(
        `/reservations/delete-reservation/${deleteModal.reservationId}`
      );

      // Remove the deleted reservation from state
      setReservations((prev) =>
        prev.filter((r) => r._id !== deleteModal.reservationId)
      );

      toast.success("Reservation deleted successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setDeleteModal({ show: false, reservationId: null });
    } catch (err) {
      console.error("Error deleting reservation:", err);
      toast.error(
        err.response?.data?.message || "Failed to delete reservation",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, reservationId: null });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  const formatSeats = (seats) => {
    if (!seats || seats.length === 0) return "N/A";
    return seats.map((seat) => `${seat.row}${seat.number}`).join(", ");
  };

  const formatCurrency = (amount, currency = "usd") => {
    const actualAmount = amount / 100;
    const currencySymbols = {
      usd: "$",
      eur: "€",
      gbp: "£",
      try: "₺",
    };
    const symbol = currencySymbols[currency?.toLowerCase()] || "$";
    return `${symbol}${actualAmount.toFixed(2)}`;
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReservations = filteredReservations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "reserved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ToastContainer />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Manage Reservations
          </h1>
          <p className="text-gray-600">
            View and manage all movie reservations
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Search by user, email, movie, or hall..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="reserved">Reserved</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {indexOfFirstItem + 1} -{" "}
              {Math.min(indexOfLastItem, filteredReservations.length)} of{" "}
              {filteredReservations.length} reservations
            </span>
            <span className="font-medium text-blue-600">
              Total: {reservations.length} reservations
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Reservations List */}
        {currentReservations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              <MdEventSeat className="text-6xl mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Reservations Found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentReservations.map((reservation) => (
              <div
                key={reservation._id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* User Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <FiUser className="text-blue-600 text-xl" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {reservation.user?.name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {reservation.user?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Movie Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2">
                      <FiFilm className="text-purple-600 text-lg" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Movie</p>
                        <p className="font-medium text-gray-800">
                          {reservation.movie?.title || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hall Info */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-2">
                      <FiMapPin className="text-red-600 text-lg" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Hall</p>
                        <p className="font-medium text-gray-800">
                          {reservation.hall?.name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Seats & Date/Time */}
                  <div className="lg:col-span-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MdEventSeat className="text-green-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {formatSeats(reservation.seats)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-orange-600" />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-600">
                            {reservation.showtimeDate
                              ? formatDate(reservation.showtimeDate)
                              : "N/A"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(reservation.showtime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-2">
                      <FiDollarSign className="text-emerald-600 text-lg" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Amount
                        </p>
                        <p className="font-bold text-emerald-600 text-lg">
                          {formatCurrency(
                            reservation.amount,
                            reservation.currency
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-2 flex justify-end">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                        reservation.status
                      )}`}
                    >
                      {reservation.status || "Unknown"}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <div className="lg:col-span-1 flex justify-end">
                    <button
                      onClick={() => handleDeleteClick(reservation._id)}
                      className="p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 group"
                      title="Delete reservation"
                    >
                      <FiTrash2 className="text-xl group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                <FiChevronLeft />
                Previous
              </button>

              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 &&
                      pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`w-10 h-10 rounded-lg font-medium transition ${
                          currentPage === pageNumber
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span key={pageNumber} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                Next
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <FiAlertCircle className="text-red-600 text-4xl" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Delete Reservation
            </h2>

            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this reservation? This action
              cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReservations;
