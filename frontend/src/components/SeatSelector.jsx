// src/components/SeatSelector.jsx
import { FaChair } from "react-icons/fa";

export default function SeatSelector({
  seats,
  reservedSeats,
  selectedSeats,
  onToggleSeat,
  showScreen = false,
}) {
  const rows = Array.from(new Set(seats.map((s) => s.row))).sort();

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      {showScreen && (
        <div className="w-full h-6 bg-gray-400 rounded-md mb-4 text-center text-sm text-gray-700 flex items-center justify-center">
          Screen
        </div>
      )}

      {rows.map((row) => {
        const rowSeats = seats
          .filter((s) => s.row === row)
          .sort((a, b) => a.number - b.number);

        return (
          <div key={row} className="flex items-center gap-2">
            <span className="w-6 text-sm font-medium">{row}</span>

            <div className="flex gap-2">
              {rowSeats.map((seat) => {
                const isReserved = reservedSeats.some(
                  (s) => s.row === seat.row && s.number === seat.number
                );
                const isSelected = selectedSeats.some(
                  (s) => s.row === seat.row && s.number === seat.number
                );

                let bgColor = "bg-gray-200 hover:bg-gray-300"; // available
                if (isReserved) bgColor = "bg-red-500 cursor-not-allowed";
                else if (isSelected) bgColor = "bg-green-600";

                return (
                  <button
                    key={`${seat.row}-${seat.number}`}
                    disabled={isReserved}
                    onClick={() => onToggleSeat(seat)}
                    className={`w-10 h-10 rounded-md flex items-center justify-center text-sm transition-transform duration-200 transform hover:scale-110 ${
                      isSelected ? "scale-110" : ""
                    } ${bgColor}`}
                  >
                    <FaChair className="text-white" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-500 rounded-sm" /> Reserved
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-600 rounded-sm" /> Selected
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-300 rounded-sm" /> Available
        </div>
      </div>
    </div>
  );
}
