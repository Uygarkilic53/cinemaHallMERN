import axios from "axios";
import Movie from "../models/Movie.model.js";
import Reservation from "../models/Reservation.model.js";
import Hall from "../models/Hall.model.js";

export const getInTheaters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 16;
    const skip = (page - 1) * limit;

    const [movies, total] = await Promise.all([
      Movie.find({ inTheaters: true })
        .populate("hall", "name")
        .skip(skip)
        .limit(limit),
      Movie.countDocuments({ inTheaters: true }),
    ]);

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      movies,
    });
  } catch (err) {
    console.error("Error fetching in-theaters movies:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 16;
    const skip = (page - 1) * limit;

    const [movies, total] = await Promise.all([
      Movie.find()
        .populate("hall", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Movie.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      movies,
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addMovieFromTMDB = async (req, res) => {
  try {
    const { tmdbId, title, description, duration, genre, hallId, showtimes } =
      req.body;

    // Validation
    if (!tmdbId || !hallId || !showtimes || showtimes.length === 0) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Check if hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ msg: "Hall not found" });
    }

    // Validate showtimes
    const validShowtimes = showtimes.filter((showtime) => {
      const date = new Date(showtime);
      return !isNaN(date.getTime());
    });

    if (validShowtimes.length === 0) {
      return res.status(400).json({ msg: "No valid showtimes provided" });
    }

    // If TMDb data is not provided, fetch it
    let movieData = {
      title,
      description,
      duration,
      genre,
      posterPath: req.body.posterPath || null,
    };

    if (!title || !description || !duration) {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${tmdbId}`,
          {
            params: { api_key: process.env.TMDB_API_KEY, language: "en-US" },
          }
        );

        const tmdbMovie = response.data;
        movieData = {
          title: tmdbMovie.title,
          description: tmdbMovie.overview,
          duration: tmdbMovie.runtime,
          genre: tmdbMovie.genres.map((g) => g.name),
          posterPath: tmdbMovie.poster_path || req.body.posterPath, // ✅ store posterPath safely
        };
      } catch (tmdbError) {
        return res
          .status(400)
          .json({ msg: "Failed to fetch movie data from TMDb" });
      }
    }

    // ✅ CHECK FOR DUPLICATE MOVIE BY TITLE And Id
    const existingMovie = await Movie.findOne({
      $or: [
        { title: { $regex: new RegExp(`^${movieData.title}$`, "i") } },
        { tmdbId: tmdbId },
      ],
    });

    if (existingMovie) {
      return res.status(409).json({
        msg: `Movie "${movieData.title}" already exists in the database`,
        existingMovie: {
          _id: existingMovie._id,
          title: existingMovie.title,
          hall: existingMovie.hall,
          showtimes: existingMovie.showtimes,
        },
      });
    }

    // Save in MongoDB
    const movie = await Movie.create({
      title: movieData.title,
      description: movieData.description,
      duration: movieData.duration,
      genre: movieData.genre,
      hall: hallId,
      showtimes: validShowtimes,
      posterPath: movieData.posterPath,
      tmdbId: tmdbId,
    });

    await movie.populate("hall", "name capacity");

    res.status(201).json({
      msg: "Movie added successfully",
      movie: {
        _id: movie._id,
        title: movie.title,
        description: movie.description,
        duration: movie.duration,
        genre: movie.genre,
        hall: movie.hall,
        showtimes: movie.showtimes.sort((a, b) => new Date(a) - new Date(b)),
        posterPath: movie.posterPath, // ✅ include in response
        createdAt: movie.createdAt,
      },
    });
  } catch (err) {
    console.error("Add movie error:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMovie = await Movie.findByIdAndDelete(id);

    if (!deletedMovie) {
      return res.status(404).json({ msg: "Movie not found" });
    }

    res.json({ msg: "Movie deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { hallId, showtimes } = req.body;

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({ msg: "Movie not found" });
    }
    // Check if the hall is already occupied by another in-theater movie
    if (movie.inTheaters && hallId !== movie.hall?.toString()) {
      const conflictingMovie = await Movie.findOne({
        _id: { $ne: id },
        hall: hallId,
        inTheaters: true,
      });

      if (conflictingMovie) {
        return res.status(400).json({
          msg: `Hall is already occupied by "${conflictingMovie.title}" which is currently in theaters. Please select a different hall or remove that movie from theaters first.`,
          conflictingMovie: {
            id: conflictingMovie._id,
            title: conflictingMovie.title,
          },
        });
      }
    }

    // Only update hall & showtimes
    if (hallId) movie.hall = hallId;
    if (showtimes) movie.showtimes = showtimes;

    await movie.save();

    res.json({
      msg: "Movie updated successfully",
      movie,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Toggle on off
export const updateMovieInTheaters = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the movie by ID
    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // If we are trying to turn 'inTheaters' ON, check if another movie in the same hall is already ON
    if (!movie.inTheaters) {
      const existingInHall = await Movie.findOne({
        hall: movie.hall,
        inTheaters: true,
        _id: { $ne: movie._id }, // exclude the current movie
      });

      if (existingInHall) {
        return res.status(400).json({
          success: false,
          message: `Another movie (${existingInHall.title}) is already playing in ${movie.hall}. Please remove it from theaters first.`,
        });
      }
    }

    // Toggle the inTheaters boolean
    movie.inTheaters = !movie.inTheaters;

    // Save the updated movie
    const updatedMovie = await movie.save();

    res.status(200).json({
      success: true,
      msg: `Movie ${
        updatedMovie.inTheaters ? "added to" : "removed from"
      } theaters successfully`,
      data: updatedMovie,
    });
  } catch (error) {
    console.error("Error updating movie inTheaters status", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
    });
  }
};

// get seat availability for a showtime:
export const getSeatAvailability = async (req, res) => {
  try {
    const { movieId, hallId, showtime } = req.params;

    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }

    const now = new Date();

    const reservations = await Reservation.find({
      movie: movieId,
      hall: hallId,
      showtime,
      status: "reserved",
      showtimeDate: { $gte: now },
    });

    const reservedSeats = reservations.flatMap((r) => r.seats);

    const seatsWithStatus = hall.seats.map((seat) => {
      const isReserved = reservedSeats.some(
        (r) => r.row === seat.row && r.number === seat.number
      );
      return {
        row: seat.row,
        number: seat.number,
        isReserved,
      };
    });

    res.json({
      movie: movieId,
      hall: hall.name,
      showtime,
      totalSeats: hall.totalSeats,
      seats: seatsWithStatus,
    });
  } catch (error) {
    console.error("Get seat availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
