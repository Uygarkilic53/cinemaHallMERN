import Hall from "../models/Hall.model.js";
import { seedHallsUtil } from "../utils/seedHalls.js";

export const createHall = async (req, res) => {
  try {
    const { name, totalSeats, seats } = req.body;

    const hall = new Hall({
      name,
      totalSeats,
      seats,
    });

    await hall.save();
    res.status(201).json({ msg: "Hall created successfully", hall });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getHalls = async (req, res) => {
  try {
    const halls = await Hall.find();

    // Return success response even if no halls found
    res.status(200).json({
      success: true,
      halls: halls,
      message:
        halls.length === 0 ? "No halls found" : `Found ${halls.length} halls`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const getHallById = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) return res.status(404).json({ error: "Hall not found" });
    res.status(200).json(hall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateHall = async (req, res) => {
  try {
    const { name, totalSeats, seats } = req.body;

    const hall = await Hall.findByIdAndUpdate(
      req.params.id,
      { name, totalSeats, seats },
      { new: true, runValidators: true }
    );

    if (!hall) return res.status(404).json({ message: "Hall not found" });

    res.status(200).json(hall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findByIdAndDelete(req.params.id);

    if (!hall) return res.status(404).json({ message: "Hall not found" });

    res.status(200).json({ message: "Hall deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const seedHalls = async (req, res) => {
  try {
    const force = req.query.force === "true";
    const result = await seedHallsUtil(force);

    if (result.alreadyExists) {
      return res.status(400).json({
        message:
          "⚠️ Halls already exist. Use `?force=true` to reseed (this will delete existing halls).",
      });
    }

    res.status(201).json({
      message: "✅ Successfully seeded halls",
      hallsCreated: result.hallsCreated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
