import express from "express";
import * as movieController from "../controllers/movieController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/get-in-theaters", movieController.getInTheaters);

router.get("/get-all-movies", protect, adminOnly, movieController.getAllMovies);

router.post("/add-movie", protect, adminOnly, movieController.addMovieFromTMDB);

router.delete(
  "/delete-movie/:id",
  protect,
  adminOnly,
  movieController.deleteMovie
);

router.put(
  "/update-movie/:id",
  protect,
  adminOnly,
  movieController.updateMovie
);

router.put(
  "/update-movie-in-theaters/:id",
  protect,
  adminOnly,
  movieController.updateMovieInTheaters
);

// GET seat availability for a movie in a hall at a specific showtime
router.get(
  "/:movieId/halls/:hallId/showtimes/:showtime/seats",
  protect,
  movieController.getSeatAvailability
);

export default router;
