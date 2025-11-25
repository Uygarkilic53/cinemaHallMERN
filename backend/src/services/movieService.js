import Movie from "../models/Movie.model.js";
import axios from "axios";

const convertToTurkeyTime = (isoString) => {
  const date = new Date(isoString);
  // Convert to Turkey timezone (UTC+3)
  const turkeyTime = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const hours = String(turkeyTime.getUTCHours()).padStart(2, "0");
  const minutes = String(turkeyTime.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const movieService = {
  async getMoviesInTheaters() {
    const movies = await Movie.find({ inTheaters: true }).populate("hall");
    return movies;
  },

  async getMovieDetails(title) {
    try {
      const movie = await Movie.findOne({ title }).populate("hall");
      const tmdbApiKey = process.env.TMDB_API_KEY;

      let tmdbData = null;
      if (tmdbApiKey) {
        // First, search for the movie
        const search = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(
            title
          )}`
        );

        const movieResult = search.data.results?.[0];

        if (movieResult) {
          // NOW fetch full details including cast using the movie ID
          const detailsResponse = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieResult.id}?api_key=${tmdbApiKey}&append_to_response=credits`
          );

          tmdbData = {
            ...detailsResponse.data,
            // Extract cast in a clean format
            cast: detailsResponse.data.credits?.cast
              ?.slice(0, 10)
              .map((actor) => ({
                name: actor.name,
                character: actor.character,
                profile_path: actor.profile_path,
              })),
            // Extract crew (director, etc.)
            director: detailsResponse.data.credits?.crew?.find(
              (person) => person.job === "Director"
            )?.name,
          };
        }
      }

      if (movie && movie.showtimes) {
        movie.showtimes = movie.showtimes.map((showtime) => ({
          original: showtime,
          turkeyTime: convertToTurkeyTime(showtime),
          date: new Date(showtime).toLocaleDateString("tr-TR"),
        }));
      }

      return { localMovie: movie, tmdbData };
    } catch (err) {
      console.error("getMovieDetails error:", err);
      return { error: "Failed to fetch movie details" };
    }
  },
};

export default movieService;
