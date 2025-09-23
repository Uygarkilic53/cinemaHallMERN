// src/pages/Movies.jsx
import { useEffect, useState } from "react";
import { FaClock, FaFilm, FaTicketAlt } from "react-icons/fa";
import { MdTheaters } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import CreateReservation from "../components/CreateReservation";
import { useAuth } from "../context/AuthContext";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState(null); // for reservation modal
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [trailerError, setTrailerError] = useState(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  const { auth, isLoading } = useAuth();
  const navigate = useNavigate();

  const fetchMovies = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/movies/get-in-theaters?page=${pageNumber}&limit=6`
      );
      setMovies(data.movies || []);
      setTotalPages(data.totalPages || 1);
      setPage(pageNumber);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(page);
  }, [page]);

  const handleReservationClick = (movie) => {
    if (!auth?.token) {
      navigate("/login");
      return;
    }
    setSelectedMovie(movie);
  };

  // Fetch trailer from TMDb (on demand) and open modal
  const handleWatchTrailer = async (movie) => {
    const tmdbId = movie.tmdbId;
    setTrailerKey(null);
    setTrailerError(null);
    setTrailerLoading(true);
    setShowTrailerModal(true);

    try {
      // If tmdbId exists, fetch directly
      if (tmdbId) {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=en-US`
        );
        const json = await res.json();
        const youTubeTrailer = (json.results || []).find(
          (v) =>
            v.site === "YouTube" &&
            (v.type === "Trailer" || v.type === "Teaser")
        );
        if (youTubeTrailer) {
          setTrailerKey(youTubeTrailer.key);
        } else {
          setTrailerError("No trailer found for this movie.");
        }
      } else {
        // fallback: search by title (rare)
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&query=${encodeURIComponent(movie.title)}`
        );
        const json = await res.json();
        const found = (json.results || [])[0];
        if (!found) {
          setTrailerError("Trailer not found.");
        } else {
          const vidRes = await fetch(
            `https://api.themoviedb.org/3/movie/${found.id}/videos?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }`
          );
          const vidJson = await vidRes.json();
          const youTubeTrailer = (vidJson.results || []).find(
            (v) =>
              v.site === "YouTube" &&
              (v.type === "Trailer" || v.type === "Teaser")
          );
          if (youTubeTrailer) setTrailerKey(youTubeTrailer.key);
          else setTrailerError("No trailer found.");
        }
      }
    } catch (err) {
      console.error("Trailer fetch error:", err);
      setTrailerError("Failed to fetch trailer.");
    } finally {
      setTrailerLoading(false);
    }
  };

  if (loading || isLoading)
    return <LoadingSpinner message="Fetching movies..." />;

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
        <FaFilm className="text-blue-500" /> Movies In Theaters
      </h1>

      {movies.length === 0 ? (
        <p className="text-gray-600">No movies currently in theaters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {movies.map((movie) => (
            <div
              key={movie._id}
              className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition duration-300 flex flex-col"
            >
              {movie.posterPath ? (
                <img
                  src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
                  alt={movie.title}
                  className="w-full h-60 object-cover"
                />
              ) : (
                <div className="w-full h-60 bg-gray-200 flex items-center justify-center text-gray-500">
                  No Image Available
                </div>
              )}

              <div className="p-5 flex flex-col justify-between flex-grow">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">
                    {movie.title}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {movie.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="flex items-center gap-2">
                      <FaClock className="text-blue-500" /> {movie.duration} min
                    </p>
                    <p className="flex items-center gap-2">
                      <MdTheaters className="text-red-500" />{" "}
                      {movie.hall?.name || "N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      <FaFilm className="text-green-500" />{" "}
                      {(movie.genre || []).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => handleReservationClick(movie)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                  >
                    <FaTicketAlt /> Get Reservation
                  </button>

                  <button
                    onClick={() => handleWatchTrailer(movie)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition duration-200"
                  >
                    ▶ Watch Trailer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={() => fetchMovies(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchMovies(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Reservation modal */}
      {selectedMovie && (
        <CreateReservation
          movie={selectedMovie} // pass the full movie object
          hallId={selectedMovie.hall?._id}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {/* Trailer modal */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg overflow-hidden max-w-3xl w-full">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="font-semibold">Trailer</h3>
              <button
                onClick={() => {
                  setShowTrailerModal(false);
                  setTrailerKey(null);
                  setTrailerError(null);
                }}
                className="px-3 py-1 text-sm rounded hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="p-4">
              {trailerLoading ? (
                <LoadingSpinner message="Loading trailer..." />
              ) : trailerError ? (
                <div className="text-red-500">{trailerError}</div>
              ) : trailerKey ? (
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    title="Trailer"
                    src={`https://www.youtube.com/embed/${trailerKey}`}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="w-full h-96"
                  />
                </div>
              ) : (
                <div>No trailer available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
