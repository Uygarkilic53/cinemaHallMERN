import Reservation from "../models/Reservation.model.js";
import Hall from "../models/Hall.model.js";
import Movie from "../models/Movie.model.js";

// Create reservation API
export const createReservation = async (req, res) => {
  try {
    const { movieId, hallId, showtime, seats, date } = req.body;
    // 👆 frontend must send `date` in YYYY-MM-DD format
    const userId = req.user._id;

    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // 👉 combine `date` + `showtime` into one Date object
    const showtimeDate = new Date(`${date}T${showtime}:00`);

    if (isNaN(showtimeDate.getTime())) {
      return res.status(400).json({ message: "Invalid date or showtime" });
    }

    // Check existing reservations (only future ones matter)
    const existingReservations = await Reservation.find({
      hall: hallId,
      movie: movieId,
      showtime,
      status: "reserved",
      showtimeDate: { $gte: new Date() },
    });

    const reservedSeats = existingReservations.flatMap((r) => r.seats);
    const isSeatTaken = seats.some((seat) =>
      reservedSeats.some((s) => s.row === seat.row && s.number === seat.number)
    );

    if (isSeatTaken) {
      return res
        .status(400)
        .json({ message: "One or more seats already reserved" });
    }

    // Create reservation
    const reservation = await Reservation.create({
      user: userId,
      movie: movieId,
      hall: hallId,
      showtime, // keep for UI (e.g. "22:00")
      showtimeDate, // actual Date for expiration
      seats,
    });

    res.status(201).json(reservation);
  } catch (err) {
    console.error("Create reservation error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get my reservations API
export const getMyReservations = async (req, res) => {
  try {
    const userId = req.user._id;

    const reservations = await Reservation.find({ user: userId })
      .populate("movie", "title")
      .populate("hall", "name")
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error("Get my reservations error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//  Get reservations (admin)
export const getReservations = async (req, res) => {
  try {
    const { movieId, hallId, showtime } = req.query;

    const filter = {};
    if (movieId) filter.movie = movieId;
    if (hallId) filter.hall = hallId;
    if (showtime) filter.showtime = showtime;

    const reservations = await Reservation.find(filter)
      .populate("user", "email username")
      .populate("movie", "title")
      .populate("hall", "name");

    res.json(reservations);
  } catch (error) {
    console.error("Get reservations error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//  Cancel reservation
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // only the user who made it OR admin can cancel
    if (
      reservation.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this reservation" });
    }

    reservation.status = "cancelled";
    await reservation.save();

    res.json({ message: "Reservation cancelled successfully" });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
