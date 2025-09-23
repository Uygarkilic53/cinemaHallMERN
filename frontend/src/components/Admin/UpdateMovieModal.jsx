import { useState, useEffect } from "react";
import { FiX, FiClock, FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../services/api.js";
import {
  parseShowtime,
  formatTime,
  validateShowtime,
  generateSuggestedShowtimes,
} from "../../utils/showtimes.js";

const UpdateMovieModal = ({ movie, onClose, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    hallId: "",
    showtimes: [],
  });
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newShowtime, setNewShowtime] = useState("");
  const [suggestedShowtimes, setSuggestedShowtimes] = useState([]);

  // Format existing showtimes from ISO strings to HH:MM format
  const formatExistingShowtimes = (showtimes) => {
    return showtimes.map((time) => {
      // If it's already in HH:MM format, return as is
      if (typeof time === "string" && /^\d{2}:\d{2}$/.test(time)) {
        return time;
      }
      // If it's an ISO string or Date object, format it
      const date = new Date(time);
      return formatTime(date);
    });
  };

  // Generate suggested showtimes based on existing ones
  const updateSuggestedShowtimes = (existingTimes) => {
    const movieDuration = movie?.duration || 120; // Default 120 minutes if not available
    const suggestions = generateSuggestedShowtimes(
      existingTimes,
      movieDuration,
      15,
      5
    );
    setSuggestedShowtimes(suggestions);
  };

  // Fetch available halls
  const fetchHalls = async () => {
    try {
      const res = await api.get("/halls/get-halls");

      if (Array.isArray(res.data)) {
        setHalls(res.data);
      } else if (res.data.success && res.data.halls) {
        setHalls(res.data.halls);
      } else {
        console.log("No halls found");
        setHalls([]);
      }
    } catch (err) {
      console.error("Error fetching halls:", err);

      if (err.response?.status === 404) {
        setHalls([]);
        toast.info("No halls available");
      } else {
        toast.error("Failed to fetch halls");
      }
    }
  };

  useEffect(() => {
    if (movie) {
      const formattedShowtimes = formatExistingShowtimes(movie.showtimes || []);
      setFormData({
        hallId: movie.hall?._id || "",
        showtimes: formattedShowtimes,
      });
      updateSuggestedShowtimes(formattedShowtimes);
      fetchHalls();
    }
  }, [movie]);

  // Update suggestions when showtimes change
  useEffect(() => {
    updateSuggestedShowtimes(formData.showtimes);
  }, [formData.showtimes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addShowtime = (timeStr) => {
    if (!timeStr.trim()) {
      toast.error("Please enter a valid showtime");
      return;
    }

    // Validate the showtime
    const movieDuration = movie?.duration || 120;
    const validation = validateShowtime(
      timeStr,
      movieDuration,
      formData.showtimes
    );

    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      showtimes: [...prev.showtimes, timeStr].sort(), // Sort times chronologically
    }));

    setNewShowtime(""); // Clear input
  };

  const handleAddShowtime = () => {
    addShowtime(newShowtime);
  };

  const handleSuggestedShowtimeClick = (time) => {
    addShowtime(time);
  };

  const handleRemoveShowtime = (index) => {
    setFormData((prev) => ({
      ...prev,
      showtimes: prev.showtimes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.hallId) {
      toast.error("Please select a hall");
      return;
    }

    if (formData.showtimes.length === 0) {
      toast.error("Please add at least one showtime");
      return;
    }

    try {
      setLoading(true);
      const res = await api.put(`/movies/update-movie/${movie._id}`, {
        hallId: formData.hallId,
        showtimes: formData.showtimes,
      });

      if (res.data.msg === "Movie updated successfully") {
        toast.success("Movie updated successfully");
        onUpdateSuccess();
      } else {
        toast.error("Failed to update movie");
      }
    } catch (err) {
      console.error("Error updating movie:", err);
      toast.error("Error updating movie");
    } finally {
      setLoading(false);
    }
  };

  if (!movie) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Update Movie: {movie.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Hall Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Hall
            </label>
            <select
              name="hallId"
              value={formData.hallId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a hall...</option>
              {halls.map((hall) => (
                <option key={hall._id} value={hall._id}>
                  {hall.name} (Capacity: {hall.totalSeats})
                </option>
              ))}
            </select>
          </div>

          {/* Showtimes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiClock className="inline mr-1" />
              Showtimes
            </label>

            {/* Manual showtime input */}
            <div className="flex gap-2 mb-3">
              <input
                type="time"
                value={newShowtime}
                onChange={(e) => setNewShowtime(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Select time"
              />
              <button
                type="button"
                onClick={handleAddShowtime}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-1"
              >
                <FiPlus size={16} />
                Add
              </button>
            </div>

            {/* Suggested showtimes */}
            {suggestedShowtimes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Suggested times:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedShowtimes.map((time, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestedShowtimeClick(time)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Display existing showtimes */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">
                Current showtimes:
              </p>
              {formData.showtimes.map((time, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                >
                  <span className="text-gray-700 font-medium">{time}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveShowtime(index)}
                    className="text-red-600 hover:text-red-800 transition p-1"
                    title="Remove showtime"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
              {formData.showtimes.length === 0 && (
                <p className="text-gray-500 text-sm italic">
                  No showtimes added yet
                </p>
              )}
            </div>
          </div>

          {/* Movie info for reference */}
          {movie.duration && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <p>
                <strong>Movie Duration:</strong> {movie.duration} minutes
              </p>
              <p>
                <strong>Note:</strong> Showtimes include 15-minute breaks
                between showings
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Movie"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateMovieModal;
