import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    hall: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", required: true },
    showtime: { type: String, required: true },
    showtimeDate: { type: Date, required: true },
    seats: [
      {
        row: { type: String, required: true },
        number: { type: Number, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "reserved", "cancelled"],
      default: "pending",
    },
    stripePaymentIntentId: {
      type: String,
      required: false, // ✅ Change to false - it's added after creation
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);
