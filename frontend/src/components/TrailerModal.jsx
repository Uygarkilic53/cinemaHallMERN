import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export default function TrailerModal({ movie, onClose }) {
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrailer = async () => {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/movie/${movie.tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const data = await res.json();
        const trailer = data.results.find(
          (vid) => vid.type === "Trailer" && vid.site === "YouTube"
        );
        setTrailerKey(trailer ? trailer.key : null);
      } catch (err) {
        console.error("Failed to fetch trailer:", err);
      } finally {
        setLoading(false);
      }
    };

    if (movie.tmdbId) fetchTrailer();
    else setLoading(false);
  }, [movie]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 p-4 border-b">
          {movie.title} – Trailer
        </h2>

        <div className="aspect-video w-full flex items-center justify-center">
          {loading ? (
            <p className="text-gray-600">Fetching trailer...</p>
          ) : trailerKey ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${trailerKey}`}
              title="Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <p className="text-gray-600 p-6">
              No trailer available.{" "}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  movie.title + " trailer"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Search on YouTube
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
