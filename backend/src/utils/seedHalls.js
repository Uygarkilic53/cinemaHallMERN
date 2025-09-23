import Hall from "../models/Hall.model.js";

const rows = ["A", "B", "C", "D", "E", "F", "G"];
const seatsPerRow = 11;
const numberOfHalls = 6;

const generateSeats = () => {
  const seats = [];
  rows.forEach((row) => {
    for (let i = 1; i <= seatsPerRow; i++) {
      seats.push({ row, number: i, isReserved: false });
    }
  });
  return seats;
};

// ✅ Seeding logic (used by controller)
export const seedHallsUtil = async (force = false) => {
  const existingHalls = await Hall.countDocuments();

  if (existingHalls > 0 && !force) {
    return { alreadyExists: true };
  }

  if (existingHalls > 0 && force) {
    await Hall.deleteMany();
  }

  const halls = [];
  for (let i = 1; i <= numberOfHalls; i++) {
    halls.push({
      name: `Hall ${i}`,
      totalSeats: rows.length * seatsPerRow,
      seats: generateSeats(),
    });
  }

  await Hall.insertMany(halls);

  return { created: true, hallsCreated: numberOfHalls };
};
