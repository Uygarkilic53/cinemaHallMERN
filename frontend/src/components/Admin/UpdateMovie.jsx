import { useEffect, useState } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../services/api.js";
import UpdateMovieModal from "./UpdateMovieModal.jsx";
import LoadingSpinner from "../LoadingSpinner";

const UpdateMovie = () => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieBanners, setMovieBanners] = useState({});

  const limit = 16; // movies per page

  // Function to fetch movie banner from TMDB
  const fetchMovieBanner = async (movieTitle) => {
    try {
      const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY; // Replace with your actual TMDB API key
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          movieTitle
        )}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const movie = data.results[0];
        return movie.backdrop_path
          ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
          : movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching movie banner:", error);
      return null;
    }
  };

  // Fetch movie banners for all movies
  const fetchAllMovieBanners = async (moviesList) => {
    const banners = {};

    await Promise.all(
      moviesList.map(async (movie) => {
        if (!movieBanners[movie._id]) {
          const banner = await fetchMovieBanner(movie.title);
          banners[movie._id] = banner;
        }
      })
    );

    setMovieBanners((prev) => ({ ...prev, ...banners }));
  };

  // Fetch movies
  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/movies/get-all-movies?page=${page}&limit=${limit}`
      );
      if (res.data.success) {
        setMovies(res.data.movies);
        setTotalPages(res.data.totalPages);

        // Fetch banners for the movies
        await fetchAllMovieBanners(res.data.movies);
      } else {
        toast.error("Failed to fetch movies");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching movies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [page]);

  // Delete movie
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;
    try {
      await api.delete(`/movies/delete-movie/${id}`);
      toast.success("Movie deleted successfully");
      fetchMovies();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete movie");
    }
  };

  // Toggle InTheaters
  const handleToggleInTheaters = async (id) => {
    try {
      await api.put(`/movies/update-movie-in-theaters/${id}`);
      toast.success("Movie inTheaters status updated");
      fetchMovies();
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || "Failed to update inTheaters";
      err.response?.data?.error ||
        "Error updating movie inTheaters status: There might be another movie in the same hall";
      ("Failed to update inTheaters");
      toast.error(errorMessage);
    }
  };

  const handleUpdateSuccess = () => {
    setSelectedMovie(null);
    fetchMovies();
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Update Movies</h2>

      {loading ? (
        <LoadingSpinner message="Loading Movies" />
      ) : movies.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl font-medium">No movies have been added yet.</p>
          <p className="mt-2">
            Use the "Add Movie" option to create your first movie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div
              key={movie._id}
              className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col"
            >
              {/* Movie banner */}
              <div className="bg-gray-200 h-40 overflow-hidden">
                {movieBanners[movie._id] ? (
                  <img
                    src={movieBanners[movie._id]}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full flex items-center justify-center text-gray-500 ${
                    movieBanners[movie._id] ? "hidden" : "flex"
                  }`}
                >
                  {movieBanners[movie._id] === null
                    ? "No Image Available"
                    : "Loading..."}
                </div>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {movie.title}
                </h3>
                <p className="text-sm text-gray-600 flex-grow">
                  {movie.description}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Hall: {movie.hall?.name || "Unknown"}
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedMovie(movie)}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    <FiEdit /> Update
                  </button>

                  <button
                    onClick={() => handleDelete(movie._id)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition"
                  >
                    <FiTrash2 /> Delete
                  </button>

                  <button
                    onClick={() => handleToggleInTheaters(movie._id)}
                    className={`px-3 py-2 rounded-md text-white transition ${
                      movie.inTheaters
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 hover:bg-gray-500"
                    }`}
                  >
                    {movie.inTheaters ? "In Theaters" : "Not in Theaters"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 gap-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-700">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Update Modal */}
      {selectedMovie && (
        <UpdateMovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default UpdateMovie;
