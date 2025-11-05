import Movie from "../models/Movie.model.js";
import axios from "axios";

const movieService = {
  async getMoviesInTheaters() {
    const movies = await Movie.find({ inTheaters: true });
    return movies;
  },

  async getMovieDetails(title) {
    try {
      const movie = await Movie.findOne({ title });
      const tmdbApiKey = process.env.TMDB_API_KEY;

      let tmdbData = null;
      if (tmdbApiKey) {
        const search = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(
            title
          )}`
        );
        tmdbData = search.data.results?.[0] || null;
      }

      return { localMovie: movie, tmdbData };
    } catch (err) {
      console.error("getMovieDetails error:", err);
      return { error: "Failed to fetch movie details" };
    }
  },
};

export default movieService;
