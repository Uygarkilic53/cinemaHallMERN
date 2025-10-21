import Reservation from "../models/Reservation.model.js";
import Hall from "../models/Hall.model.js";
import Movie from "../models/Movie.model.js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createReservation = async (req, res) => {
  try {
    const { movieId, hallId, showtime, seats, date } = req.body;
    const userId = req.user._id;

    // Validation
    if (!movieId || !hallId || !showtime || !seats || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select at least one seat" });
    }

    const hall = await Hall.findById(hallId);
    if (!hall) return res.status(404).json({ message: "Hall not found" });

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    // Build showtime Date
    const showtimeDate = new Date(`${date}T${showtime}:00`);
    if (isNaN(showtimeDate.getTime())) {
      return res.status(400).json({ message: "Invalid date or showtime" });
    }
    if (showtimeDate < new Date()) {
      return res.status(400).json({ message: "Showtime already passed" });
    }

    // Clean seats data (only keep row and number)
    const cleanedSeats = seats.map((seat) => ({
      row: String(seat.row),
      number: Number(seat.number),
    }));

    // Check existing reservations for seat conflicts (both reserved and pending)
    const existingReservations = await Reservation.find({
      hall: hallId,
      movie: movieId,
      showtime,
      showtimeDate,
      status: { $in: ["reserved", "pending"] }, // Include pending reservations
    });

    const reservedSeats = existingReservations.flatMap((r) => r.seats);

    const isSeatTaken = cleanedSeats.some((seat) =>
      reservedSeats.some(
        (s) =>
          String(s.row) === String(seat.row) &&
          Number(s.number) === Number(seat.number)
      )
    );

    if (isSeatTaken) {
      return res
        .status(400)
        .json({ message: "One or more seats already reserved" });
    }

    const pricePerSeat = hall.seatPrice || 20;
    const amount = cleanedSeats.length * pricePerSeat * 100; // cents

    // Create PENDING reservation first (locks the seats)
    const pendingReservation = await Reservation.create({
      user: userId,
      movie: movieId,
      hall: hallId,
      showtime,
      showtimeDate,
      seats: cleanedSeats,
      status: "pending", // Lock seats with pending status
      amount: amount,
      currency: "usd",
      createdAt: new Date(),
    });

    // Create PaymentIntent with reservation ID in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        reservationId: pendingReservation._id.toString(),
        userId: userId.toString(),
        movieId: movieId.toString(),
        hallId: hallId.toString(),
        showtime,
        date,
        movieTitle: movie.title,
        hallName: hall.name,
      },
    });

    // Update reservation with payment intent ID
    pendingReservation.stripePaymentIntentId = paymentIntent.id;
    await pendingReservation.save();

    // Set timeout to auto-cancel pending reservation after 15 minutes
    setTimeout(async () => {
      try {
        const res = await Reservation.findById(pendingReservation._id);
        if (res && res.status === "pending") {
          res.status = "cancelled";
          await res.save();
          console.log(`Auto-cancelled pending reservation ${res._id}`);
        }
      } catch (error) {
        console.error("Error auto-cancelling reservation:", error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      reservationId: pendingReservation._id,
      amount: amount / 100,
    });
  } catch (err) {
    console.error("Create reservation error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Confirm Reservation after Payment
export const confirmReservation = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user._id;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "Payment Intent ID is required" });
    }

    // Verify payment with Stripe
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!intent || intent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Find the pending reservation
    const reservation = await Reservation.findOne({
      stripePaymentIntentId: paymentIntentId,
      user: userId,
      status: "pending",
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found or already confirmed",
      });
    }

    // Simply update status to reserved (seats already locked)
    reservation.status = "reserved";
    await reservation.save();

    // Populate the reservation with details for response
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate("movie", "title posterPath")
      .populate("hall", "name")
      .populate("user", "name email");

    res.status(200).json({
      message: "Reservation confirmed successfully",
      reservation: populatedReservation,
    });
  } catch (err) {
    console.error("Confirm reservation error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Cancel reservation and process refund
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the reservation
    const reservation = await Reservation.findOne({
      _id: id,
      user: userId,
    })
      .populate("movie", "title")
      .populate("hall", "name");

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Check if reservation can be cancelled
    if (reservation.status !== "reserved") {
      return res.status(400).json({
        message: "Only reserved tickets can be cancelled",
      });
    }

    // Check if reservation is too close to showtime (cancellation only allowed up to 5 minutes before showtime)
    const now = new Date();
    const showtimeDate = new Date(reservation.showtimeDate);

    // Calculate the cancellation deadline: showtimeDate minus 5 minutes (5 * 60 * 1000 milliseconds)
    const cancellationDeadline = new Date(
      showtimeDate.getTime() - 5 * 60 * 1000
    );

    if (now >= cancellationDeadline) {
      return res.status(400).json({
        message:
          "Cannot cancel reservations less than 5 minutes before showtime",
      });
    }

    if (!reservation.stripePaymentIntentId) {
      return res.status(400).json({
        message: "No payment information found for this reservation",
      });
    }

    try {
      // Calculate refund amount
      let refundAmount = reservation.amount;
      const hoursUntilShow = (showtimeDate - now) / (1000 * 60 * 60);

      // Apply cancellation fee for cancellations within 24 hours
      if (hoursUntilShow < 24) {
        refundAmount = Math.floor(refundAmount * 0.9); // 10% cancellation fee
      }

      // Process refund through Stripe - This automatically sends money back to their bank account
      const refund = await stripe.refunds.create({
        payment_intent: reservation.stripePaymentIntentId,
        amount: refundAmount,
        reason: "requested_by_customer",
        metadata: {
          id: id.toString(),
          movieTitle: reservation.movie.title,
          hallName: reservation.hall.name,
          showtime: reservation.showtime,
          customerMessage: `Refund for movie reservation: ${
            reservation.movie.title
          } on ${new Date(reservation.showtimeDate).toDateString()}`,
        },
      });

      // Update reservation with refund info
      reservation.status = "cancelled";
      reservation.refundId = refund.id;
      reservation.refundedAt = new Date();
      reservation.refundAmount = refundAmount;
      await reservation.save();

      // The money is automatically sent back to their bank account by Stripe
      res.json({
        message:
          "Reservation cancelled successfully! Refund has been processed.",
        refundDetails: {
          refundId: refund.id,
          originalAmount: reservation.amount / 100,
          refundAmount: refundAmount / 100,
          refundStatus: refund.status,
          estimatedArrival: "5-10 business days",
          cancellationFee:
            hoursUntilShow < 24 ? (reservation.amount - refundAmount) / 100 : 0,
          bankAccountMessage: `Your refund of $${(refundAmount / 100).toFixed(
            2
          )} for "${
            reservation.movie.title
          }" reservation has been processed and will appear in your bank account within 5-10 business days.`,
        },
      });
    } catch (stripeError) {
      console.error("Stripe refund error:", stripeError);
      res.status(500).json({
        message: "Failed to process refund. Please contact support.",
        error: stripeError.message,
      });
    }
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get my reservations API
export const getMyReservations = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // First, update any expired reservations
    await Reservation.updateMany(
      {
        user: userId,
        status: "reserved",
        showtimeDate: { $lt: now },
      },
      {
        $set: { status: "expired" },
      }
    );

    // Then fetch all reservations
    const reservations = await Reservation.find({ user: userId })
      .populate("movie", "title posterPath")
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
      .populate("user", "email name")
      .populate("movie", "title")
      .populate("hall", "name")
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error("Get reservations error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndDelete(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.status(200).json({ message: "Reservation deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
