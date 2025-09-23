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
    showtime: { type: String, required: true }, // keep string for UI (like "22:00")
    showtimeDate: { type: Date, required: true }, // store actual date+time
    seats: [
      {
        row: String,
        number: Number,
      },
    ],
    status: {
      type: String,
      enum: ["reserved", "cancelled", "expired"],
      default: "reserved",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);
