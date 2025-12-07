import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor } from "lucide-react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const Halls = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const response = await api.get("/halls/get-halls");

        // Handle different response structures
        const hallsData = Array.isArray(response.data)
          ? response.data
          : response.data.halls || [];

        setHalls(hallsData);
      } catch (error) {
        console.error("Error fetching halls:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHalls();
  }, []);

  const handleHallClick = (hallId) => {
    navigate(`/hall/${hallId}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading Cinema Halls..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-4 text-center">
          Cinema Halls
        </h1>
        <p className="text-purple-200 text-center mb-12 text-lg">
          View our IMAX theater layouts and seating arrangements
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {halls && halls.length > 0 ? (
            halls.map((hall) => (
              <div
                key={hall._id}
                onClick={() => handleHallClick(hall._id)}
                className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 border border-slate-700 hover:border-purple-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      {hall.name}
                    </h2>
                    <Monitor className="w-10 h-10 text-purple-400 group-hover:text-purple-300 transition-colors" />
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-lg">Total Seats</span>
                    <span className="text-2xl font-semibold text-purple-400">
                      {hall.totalSeats}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm">Click to view layout</span>
                    <svg
                      className="w-5 h-5 ml-2 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center text-slate-300 text-lg">
              No halls available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Halls;
