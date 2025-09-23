import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import hallRoutes from "./routes/hallRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();
const app = express();

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/halls", hallRoutes);

// 404 Not Found Middleware
app.use((req, res, next) => {
  res.status(404).json({
    message: "404 Not Found",
    path: req.originalUrl,
  });
});

// Database + Server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
