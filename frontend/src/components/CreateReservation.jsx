// src/components/CreateReservation.jsx
import { useEffect, useState } from "react";
import { FaClock, FaChair, FaTimes } from "react-icons/fa";
import api from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import SeatSelector from "./SeatSelector";

export default function CreateReservation({ movie, hallId, onClose }) {
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [hallData, setHallData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Determine if the selected showtime is in the past (compare today's date + time)
  const isPastShowtime = selectedShowtime
    ? (() => {
        const [hour, minute] = selectedShowtime.split(":").map(Number);
        const now = new Date();
        const showtimeDate = new Date();
        showtimeDate.setHours(hour, minute, 0, 0);
        return showtimeDate < now;
      })()
    : false;

  // Fetch seats after selecting a showtime
  useEffect(() => {
    const fetchSeats = async () => {
      if (!selectedShowtime || !hallId) return;

      try {
        setLoading(true);
        const showtimeParam = encodeURIComponent(selectedShowtime); // send "HH:mm"

        const res = await api.get(
          `/movies/${movie._id}/halls/${hallId}/showtimes/${showtimeParam}/seats`
        );
        setHallData(res.data);
        setSelectedSeats([]);
      } catch (err) {
        console.error("Error loading seats:", err);
        setHallData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [selectedShowtime, hallId, movie._id]);

  const toggleSeatSelection = (seat) => {
    if (seat.isReserved || isPastShowtime) return;
    const alreadySelected = selectedSeats.some(
      (s) => s.row === seat.row && s.number === seat.number
    );
    if (alreadySelected) {
      setSelectedSeats((prev) =>
        prev.filter((s) => !(s.row === seat.row && s.number === seat.number))
      );
    } else {
      setSelectedSeats((prev) => [...prev, seat]);
    }
  };

  const handleReservation = async () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    // today’s date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const body = {
      movieId: movie._id,
      hallId,
      showtime: selectedShowtime,
      date: today,
      seats: selectedSeats,
    };

    try {
      await api.post("/reservations/create-reservation", body);
      alert("Reservation created successfully!");
      onClose();
    } catch (err) {
      console.error("Reservation error:", err);
      alert(err.response?.data?.message || err.message || "Reservation failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="relative p-6 bg-white rounded-xl shadow-lg max-w-3xl w-full space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <FaTimes size={20} />
        </button>

        {/* Movie card */}
        <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-3">
          {movie.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
              alt={movie.title}
              className="w-20 h-28 object-cover rounded"
            />
          ) : (
            <div className="w-20 h-28 bg-gray-300 flex items-center justify-center text-gray-500 rounded">
              No Image
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-bold">{movie.title}</h3>
            <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
              <FaClock /> {movie.duration} min
            </p>
            <p className="text-sm text-gray-700 mt-1">
              {movie.genre?.join(", ")}
            </p>
          </div>
        </div>

        {/* Showtimes (only display time, not date) */}
        <div className="flex flex-wrap gap-3">
          {movie.showtimes.map((st) => {
            const timeStr = new Date(st).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            const [hour, minute] = timeStr.split(":").map(Number);
            const now = new Date();
            const showtimeDate = new Date();
            showtimeDate.setHours(hour, minute, 0, 0);
            const past = showtimeDate < now;

            return (
              <button
                key={timeStr}
                disabled={past}
                onClick={() => setSelectedShowtime(timeStr)}
                className={`px-3 py-1 rounded-lg ${
                  selectedShowtime === timeStr
                    ? "bg-blue-600 text-white"
                    : past
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {timeStr}
              </button>
            );
          })}
        </div>

        {loading && <LoadingSpinner message="Loading seats..." />}

        {selectedShowtime && !loading && hallData && (
          <>
            {/* Seat layout */}
            <SeatSelector
              seats={hallData.seats}
              reservedSeats={hallData.seats.filter((s) => s.isReserved)}
              selectedSeats={selectedSeats}
              onToggleSeat={toggleSeatSelection}
              showScreen={true}
            />

            {/* Legend */}
            <div className="flex gap-6 text-sm justify-center">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500 rounded-sm" /> Reserved
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-600 rounded-sm" /> Selected
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-300 rounded-sm" /> Available
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReservation}
                disabled={selectedSeats.length === 0 || isPastShowtime}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Confirm Reservation ({selectedSeats.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
