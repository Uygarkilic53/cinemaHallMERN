import { useEffect, useState } from "react";
import axios from "axios";
import { FiPlus, FiX, FiClock } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { showSuccess, showError } from "../../utils/toast";
import {
  parseShowtime,
  formatTime,
  isWithinCinemaHours,
  isOverlappingShowtimes,
  generateSuggestedShowtimes,
  validateShowtime,
} from "../../utils/showtimes";
import { toast } from "react-toastify";

export default function AddMovie() {
  const { auth } = useAuth();
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [hallId, setHallId] = useState("");
  const [showtimes, setShowtimes] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [halls, setHalls] = useState([]);
  const [suggestedTimes, setSuggestedTimes] = useState([]);

  // Fetch halls and movies
  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/halls/get-halls",
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        setHalls(res.data.halls || res.data);
      } catch (err) {
        showError("Failed to fetch halls");
      }
    };

    const fetchNowPlaying = async () => {
      try {
        const res = await axios.get(
          "https://api.themoviedb.org/3/movie/now_playing",
          {
            params: {
              api_key: import.meta.env.VITE_TMDB_API_KEY,
              language: "en-US",
            },
          }
        );
        setMovies(res.data.results);
      } catch (err) {
        showError("Failed to fetch movies from TMDb");
      }
    };

    fetchHalls();
    fetchNowPlaying();
  }, [auth.token]);

  // Fetch detailed movie info when a movie is selected
  useEffect(() => {
    if (selectedMovie) {
      const fetchMovieDetails = async () => {
        try {
          const res = await axios.get(
            `https://api.themoviedb.org/3/movie/${selectedMovie.id}`,
            {
              params: {
                api_key: import.meta.env.VITE_TMDB_API_KEY,
                language: "en-US",
              },
            }
          );
          setMovieDetails(res.data);
          // Generate initial suggestions
          updateSuggestedTimes([""], res.data.runtime);
        } catch (err) {
          showError("Failed to fetch movie details");
          // Fallback to a default duration if API fails
          setMovieDetails({ ...selectedMovie, runtime: 120 });
          updateSuggestedTimes([""], 120);
        }
      };
      fetchMovieDetails();
    }
  }, [selectedMovie]);

  // Update suggested times when showtimes change
  const updateSuggestedTimes = (currentShowtimes, duration) => {
    if (!duration) return;

    const validTimes = currentShowtimes.filter((time) => time.trim() !== "");
    const suggestions = generateSuggestedShowtimes(validTimes, duration, 15, 5);
    setSuggestedTimes(suggestions);
  };

  // Add movie
  const handleAddMovie = async () => {
    if (!selectedMovie || !movieDetails || !hallId) {
      showError("⚠️ Please select a movie and hall.");
      return;
    }

    const validShowtimes = showtimes.filter((time) => time.trim() !== "");

    if (validShowtimes.length === 0) {
      showError("⚠️ Please add at least one showtime.");
      return;
    }

    // Validate all showtimes
    const invalidShowtimes = [];
    for (let i = 0; i < validShowtimes.length; i++) {
      const validation = validateShowtime(
        validShowtimes[i],
        movieDetails.runtime,
        validShowtimes.slice(0, i)
      );
      if (!validation.isValid) {
        invalidShowtimes.push(
          `Showtime ${i + 1}: ${validation.errors.join(", ")}`
        );
      }
    }

    if (invalidShowtimes.length > 0) {
      showError(`Please fix these issues:\n${invalidShowtimes.join("\n")}`);
      return;
    }

    const formattedShowtimes = validShowtimes
      .map(parseShowtime)
      .filter(Boolean);

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:3000/api/movies/add-movie",
        {
          tmdbId: selectedMovie.id,
          title: movieDetails.title,
          description: movieDetails.overview,
          duration: movieDetails.runtime,
          genre: movieDetails.genres?.map((g) => g.name) || [],
          hallId,
          showtimes: formattedShowtimes,
          posterPath: movieDetails.poster_path,
        },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      toast.success("Movie added successfully!");
      // Reset form
      setSelectedMovie(null);
      setMovieDetails(null);
      setHallId("");
      setShowtimes([""]);
      setSuggestedTimes([]);
    } catch (err) {
      showError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle showtime input changes
  const handleShowtimeChange = (index, value) => {
    const newShowtimes = [...showtimes];
    newShowtimes[index] = value;
    setShowtimes(newShowtimes);

    if (movieDetails?.runtime) {
      updateSuggestedTimes(newShowtimes, movieDetails.runtime);
    }
  };

  // Validate showtime on blur
  const handleShowtimeBlur = (index, value) => {
    if (!value.trim()) return;

    const newShowtimes = [...showtimes];
    const otherTimes = newShowtimes.filter(
      (_, i) => i !== index && _.trim() !== ""
    );

    const validation = validateShowtime(
      value,
      movieDetails?.runtime || 120,
      otherTimes
    );

    if (!validation.isValid) {
      showError(validation.errors.join(" "));
      newShowtimes[index] = "";
      setShowtimes(newShowtimes);
      return;
    }

    // Format the time properly
    const parsed = parseShowtime(value);
    newShowtimes[index] = formatTime(parsed);
    setShowtimes(newShowtimes);

    if (movieDetails?.runtime) {
      updateSuggestedTimes(newShowtimes, movieDetails.runtime);
    }
  };

  // Add a new showtime input
  const addShowtimeInput = () => {
    setShowtimes([...showtimes, ""]);
  };

  // Remove a showtime input
  const removeShowtimeInput = (index) => {
    if (showtimes.length > 1) {
      const newShowtimes = showtimes.filter((_, i) => i !== index);
      setShowtimes(newShowtimes);

      if (movieDetails?.runtime) {
        updateSuggestedTimes(newShowtimes, movieDetails.runtime);
      }
    }
  };

  // Add suggested time
  const addSuggestedTime = (suggestedTime) => {
    // Find first empty input or add new one
    const emptyIndex = showtimes.findIndex((time) => time.trim() === "");
    const newShowtimes = [...showtimes];

    if (emptyIndex >= 0) {
      newShowtimes[emptyIndex] = suggestedTime;
    } else {
      newShowtimes.push(suggestedTime);
    }

    setShowtimes(newShowtimes);
    updateSuggestedTimes(newShowtimes, movieDetails?.runtime || 120);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">
        Add Movie from TMDb (Now Playing)
      </h2>

      {!selectedMovie ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-h-[60vh] overflow-y-auto">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="cursor-pointer bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition"
              onClick={() => setSelectedMovie(movie)}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.target.src = "/placeholder-movie.jpg"; // Add a placeholder image
                }}
              />
              <div className="p-3">
                <h3 className="font-semibold text-gray-700">{movie.title}</h3>
                <p className="text-sm text-gray-500">
                  Release: {movie.release_date}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-start gap-4">
            <img
              src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
              alt={selectedMovie.title}
              className="w-32 rounded"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{selectedMovie.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedMovie.overview}
              </p>
              {movieDetails && (
                <div className="text-sm text-gray-500 space-y-1">
                  <p>
                    <strong>Duration:</strong> {movieDetails.runtime} minutes
                  </p>
                  <p>
                    <strong>Genre:</strong>{" "}
                    {movieDetails.genres?.map((g) => g.name).join(", ")}
                  </p>
                  <p>
                    <strong>Rating:</strong> {movieDetails.vote_average}/10
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hall selection */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Select Hall
            </label>
            <select
              value={hallId}
              onChange={(e) => setHallId(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a hall --</option>
              {halls.map((hall) => (
                <option key={hall._id} value={hall._id}>
                  {hall.name} (Capacity: {hall.totalSeats})
                </option>
              ))}
            </select>
          </div>

          {/* Showtimes */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Showtimes
            </label>
            <div className="space-y-2">
              {showtimes.map((time, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => handleShowtimeChange(idx, e.target.value)}
                    onBlur={(e) => handleShowtimeBlur(idx, e.target.value)}
                    placeholder="e.g. 18:00"
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                  {showtimes.length > 1 && (
                    <button
                      onClick={() => removeShowtimeInput(idx)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addShowtimeInput}
                className="text-sm text-blue-600 flex items-center gap-1 hover:text-blue-800"
              >
                <FiPlus /> Add Showtime
              </button>
            </div>

            {/* Suggested times */}
            {suggestedTimes.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FiClock className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Suggested next showtimes:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedTimes.map((time, idx) => (
                    <button
                      key={idx}
                      onClick={() => addSuggestedTime(time)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  *Includes {movieDetails?.runtime || 120} min movie + 15 min
                  break
                </p>
              </div>
            )}
          </div>

          {/* Cinema hours info */}
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Cinema Hours:</strong> 08:00 - 00:00 (midnight)
            <br />
            <strong>Break Time:</strong> 15 minutes between shows
            <br />
            <strong>Note:</strong> Last show must end before midnight
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleAddMovie}
              disabled={loading || !movieDetails}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Movie"}
            </button>
            <button
              onClick={() => {
                setSelectedMovie(null);
                setMovieDetails(null);
                setHallId("");
                setShowtimes([""]);
                setSuggestedTimes([]);
              }}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
