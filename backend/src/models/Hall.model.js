import mongoose from "mongoose";

const hallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Hall 1"
    totalSeats: { type: Number, required: true },
    seats: [
      {
        row: String, // e.g., "A", "B"
        number: Number, // e.g., 1, 2, 3
        isReserved: { type: Boolean, default: false },
        seatPrice: { type: Number, required: true, default: 20 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Hall", hallSchema);
