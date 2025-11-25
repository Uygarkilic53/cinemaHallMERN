import Hall from "../models/Hall.model.js";
import Reservation from "../models/Reservation.model.js";
import Movie from "../models/Movie.model.js";

/**
 * Get all halls with their basic information
 */
const getAllHalls = async () => {
  try {
    const halls = await Hall.find({});
    return halls.map((hall) => ({
      id: hall._id,
      name: hall.name,
      totalSeats: hall.totalSeats,
      rows: [...new Set(hall.seats.map((s) => s.row))].sort(),
      seatsPerRow: hall.seats.filter((s) => s.row === "A").length || 0,
    }));
  } catch (error) {
    console.error("Error fetching halls:", error);
    throw error;
  }
};

/**
 * Get specific hall by name
 */
const getHallByName = async (hallName) => {
  try {
    const hall = await Hall.findOne({
      name: { $regex: new RegExp(`^${hallName}$`, "i") },
    });

    if (!hall) {
      return null;
    }

    return {
      id: hall._id,
      name: hall.name,
      totalSeats: hall.totalSeats,
      seats: hall.seats.map((seat) => ({
        row: seat.row,
        number: seat.number,
        basePrice: seat.seatPrice,
      })),
    };
  } catch (error) {
    console.error("Error fetching hall:", error);
    throw error;
  }
};

/**
 * Parse time string and create date for Turkey timezone
 */
const parseShowtime = (showtimeString, baseDate = null) => {
  const timeMatch = showtimeString.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    return null;
  }

  const [_, hours, minutes] = timeMatch;
  const targetDate = baseDate ? new Date(baseDate) : new Date();

  targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return targetDate;
};

/**
 * Get seat availability for a specific showtime
 */
const getShowtimeSeats = async (
  hallName,
  showtimeString,
  dateString = null
) => {
  try {
    // Find the hall
    const hall = await Hall.findOne({
      name: { $regex: new RegExp(`^${hallName}$`, "i") },
    });

    if (!hall) {
      return { error: "Hall not found" };
    }

    // Parse the showtime
    const showtimeDate = parseShowtime(showtimeString, dateString);
    if (!showtimeDate) {
      return { error: "Invalid time format. Use HH:MM (e.g., 18:45)" };
    }

    // Create date range for the showtime (same day, specific time)
    const startOfDay = new Date(showtimeDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(showtimeDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find reservations for this hall, date, and showtime
    const reservations = await Reservation.find({
      hall: hall._id,
      showtime: showtimeString,
      showtimeDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ["pending", "reserved"] },
    }).populate("movie", "title");

    // Collect all reserved seats
    const reservedSeatsSet = new Set();
    let movieTitle = "Unknown";

    reservations.forEach((reservation) => {
      if (reservation.movie?.title) {
        movieTitle = reservation.movie.title;
      }
      reservation.seats.forEach((seat) => {
        reservedSeatsSet.add(`${seat.row}-${seat.number}`);
      });
    });

    // Map all seats with availability
    const seatsWithAvailability = hall.seats.map((seat) => ({
      row: seat.row,
      number: seat.number,
      isReserved: reservedSeatsSet.has(`${seat.row}-${seat.number}`),
      price: seat.seatPrice,
    }));

    const availableCount = seatsWithAvailability.filter(
      (s) => !s.isReserved
    ).length;
    const reservedCount = seatsWithAvailability.filter(
      (s) => s.isReserved
    ).length;

    return {
      hallName: hall.name,
      movieTitle,
      showtime: showtimeString,
      date: showtimeDate.toISOString().split("T")[0],
      totalSeats: hall.totalSeats,
      availableSeats: availableCount,
      reservedSeats: reservedCount,
      seats: seatsWithAvailability,
    };
  } catch (error) {
    console.error("Error fetching showtime seats:", error);
    throw error;
  }
};

/**
 * Check if specific seats are available for a showtime
 */
const checkSeatsForShowtime = async (
  hallName,
  showtimeString,
  seatRequests,
  dateString = null
) => {
  try {
    const showtimeData = await getShowtimeSeats(
      hallName,
      showtimeString,
      dateString
    );

    if (showtimeData.error) {
      return showtimeData;
    }

    const seatStatuses = seatRequests.map((request) => {
      const seat = showtimeData.seats.find(
        (s) => s.row === request.row && s.number === request.number
      );

      if (!seat) {
        return {
          row: request.row,
          number: request.number,
          status: "not_found",
        };
      }

      return {
        row: seat.row,
        number: seat.number,
        status: seat.isReserved ? "reserved" : "available",
        price: seat.price,
      };
    });

    return {
      hallName: showtimeData.hallName,
      movieTitle: showtimeData.movieTitle,
      showtime: showtimeData.showtime,
      date: showtimeData.date,
      requestedSeats: seatStatuses,
    };
  } catch (error) {
    console.error("Error checking seats for showtime:", error);
    throw error;
  }
};

/**
 * Get all showtimes for a hall on a specific date
 */
const getHallShowtimes = async (hallName, dateString = null) => {
  try {
    const hall = await Hall.findOne({
      name: { $regex: new RegExp(`^${hallName}$`, "i") },
    });

    if (!hall) {
      return { error: "Hall not found" };
    }

    // Default to today if no date specified
    const targetDate = dateString ? new Date(dateString) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get all unique showtimes for this hall on this date
    const reservations = await Reservation.find({
      hall: hall._id,
      showtimeDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate("movie", "title");

    // Group by showtime and movie
    const showtimeMap = new Map();

    for (const reservation of reservations) {
      const key = `${reservation.showtime}-${reservation.movie?._id}`;

      if (!showtimeMap.has(key)) {
        showtimeMap.set(key, {
          showtime: reservation.showtime,
          movieTitle: reservation.movie?.title || "Unknown",
          movieId: reservation.movie?._id,
          reservedSeats: new Set(),
        });
      }

      // Add reserved seats
      if (
        reservation.status === "pending" ||
        reservation.status === "reserved"
      ) {
        reservation.seats.forEach((seat) => {
          showtimeMap.get(key).reservedSeats.add(`${seat.row}-${seat.number}`);
        });
      }
    }

    // Convert to array and calculate availability
    const showtimes = Array.from(showtimeMap.values())
      .map((st) => {
        const reservedCount = st.reservedSeats.size;
        const availableSeats = hall.totalSeats - reservedCount;

        return {
          movieTitle: st.movieTitle,
          time: st.showtime,
          availableSeats,
          totalSeats: hall.totalSeats,
          reservedSeats: reservedCount,
        };
      })
      .sort((a, b) => {
        // Sort by time
        const [aHour, aMin] = a.time.split(":").map(Number);
        const [bHour, bMin] = b.time.split(":").map(Number);
        return aHour * 60 + aMin - (bHour * 60 + bMin);
      });

    return {
      hallName: hall.name,
      date: startOfDay.toISOString().split("T")[0],
      showtimes,
    };
  } catch (error) {
    console.error("Error fetching hall showtimes:", error);
    throw error;
  }
};

/**
 * Get all available showtimes across all halls for a specific movie
 */
const getMovieShowtimes = async (movieTitle, dateString = null) => {
  try {
    // Find the movie
    const movie = await Movie.findOne({
      title: { $regex: new RegExp(movieTitle, "i") },
    });

    if (!movie) {
      return { error: "Movie not found" };
    }

    // Default to today if no date specified
    const targetDate = dateString ? new Date(dateString) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get all reservations for this movie on this date
    const reservations = await Reservation.find({
      movie: movie._id,
      showtimeDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate("hall", "name totalSeats");

    // Group by hall and showtime
    const showtimeMap = new Map();

    for (const reservation of reservations) {
      const key = `${reservation.hall._id}-${reservation.showtime}`;

      if (!showtimeMap.has(key)) {
        showtimeMap.set(key, {
          hallName: reservation.hall.name,
          showtime: reservation.showtime,
          totalSeats: reservation.hall.totalSeats,
          reservedSeats: new Set(),
        });
      }

      // Add reserved seats
      if (
        reservation.status === "pending" ||
        reservation.status === "reserved"
      ) {
        reservation.seats.forEach((seat) => {
          showtimeMap.get(key).reservedSeats.add(`${seat.row}-${seat.number}`);
        });
      }
    }

    // Convert to array
    const showtimes = Array.from(showtimeMap.values())
      .map((st) => ({
        hallName: st.hallName,
        time: st.showtime,
        availableSeats: st.totalSeats - st.reservedSeats.size,
        totalSeats: st.totalSeats,
      }))
      .sort((a, b) => {
        // Sort by hall name, then time
        if (a.hallName !== b.hallName) {
          return a.hallName.localeCompare(b.hallName);
        }
        const [aHour, aMin] = a.time.split(":").map(Number);
        const [bHour, bMin] = b.time.split(":").map(Number);
        return aHour * 60 + aMin - (bHour * 60 + bMin);
      });

    return {
      movieTitle: movie.title,
      date: startOfDay.toISOString().split("T")[0],
      showtimes,
    };
  } catch (error) {
    console.error("Error fetching movie showtimes:", error);
    throw error;
  }
};

export default {
  getAllHalls,
  getHallByName,
  getShowtimeSeats,
  checkSeatsForShowtime,
  getHallShowtimes,
  getMovieShowtimes,
};
