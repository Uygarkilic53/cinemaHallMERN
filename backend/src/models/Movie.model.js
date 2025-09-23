import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    duration: Number, // in minutes
    genre: [String],
    hall: { type: mongoose.Schema.Types.ObjectId, ref: "Hall" },
    showtimes: [String],
    inTheaters: { type: Boolean, default: false }, // New attribute
    posterPath: String,
    tmdbId: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Movie", movieSchema);
