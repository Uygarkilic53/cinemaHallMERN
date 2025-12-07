import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Armchair, LogOut, DoorOpen } from "lucide-react";
import api from "../services/api";
import LoadingSpinner from "./LoadingSpinner";

const Hall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHall = async () => {
      try {
        const response = await api.get(`/halls/get-hall/${id}`);
        setHall(response.data);
      } catch (error) {
        console.error("Error fetching hall:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHall();
  }, [id]);

  const getSeatsByRow = (row) => {
    return hall?.seats.filter((seat) => seat.row === row) || [];
  };

  if (loading) {
    return <LoadingSpinner message="Loading Hall..." />;
  }

  const rows = ["A", "B", "C", "D", "E", "F", "G"];

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => navigate("/halls")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Halls
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider">
            {hall?.name}
          </h1>
          <div className="w-32"></div>
        </div>

        {/* 3D Screen Effect */}
        <div className="mb-16 relative flex flex-col items-center justify-center">
          <div className="relative w-3/4 h-24 bg-gradient-to-b from-white/20 to-transparent rounded-t-[50%] transform perspective-[500px] rotate-x-12 shadow-[0_20px_60px_-10px_rgba(255,255,255,0.3)] border-t border-white/30 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-end justify-center pb-4">
              <span className="text-white/40 font-bold tracking-[0.5em] text-sm">
                IMAX SCREEN
              </span>
            </div>
          </div>
          <div className="w-2/3 h-12 bg-purple-500/20 blur-3xl absolute -bottom-4 rounded-full"></div>
        </div>

        {/* Main Hall Container */}
        <div className="relative bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-800 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          {/* --- ENTRANCE / EXIT (Left Tunnel) --- */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
            <div className="relative bg-slate-950 w-16 h-48 border-y-2 border-r-2 border-slate-700 rounded-r-lg shadow-[10px_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center gap-4 group">
              <div className="absolute inset-y-0 left-0 w-2 bg-black/50"></div>
              <div className="text-green-500 animate-pulse">
                <DoorOpen className="w-8 h-8" />
              </div>
              {/* Updated Text */}
              <span className="text-green-500/80 text-[10px] font-bold tracking-widest uppercase rotate-90 whitespace-nowrap mt-8">
                Entrance / Exit
              </span>
              <div className="absolute bottom-0 w-full h-1 bg-green-500/20 blur-sm"></div>
            </div>
          </div>

          {/* --- EMERGENCY EXITS --- */}

          {/* Top Right Emergency Exit */}
          <div className="absolute top-6 right-0 bg-slate-950 border-l border-y border-red-900/30 px-4 py-2 rounded-l-lg flex items-center gap-3 shadow-lg group hover:bg-red-950/20 transition-colors">
            <div className="flex flex-col items-end">
              <span className="text-red-500 font-bold text-[10px] tracking-widest uppercase leading-tight">
                EMERGENCY
              </span>
              <span className="text-red-500 font-bold text-[10px] tracking-widest uppercase leading-tight">
                EXIT
              </span>
            </div>
            <LogOut className="w-5 h-5 text-red-500 animate-pulse" />
          </div>

          {/* Bottom Right Emergency Exit */}
          <div className="absolute bottom-6 right-0 bg-slate-950 border-l border-y border-red-900/30 px-4 py-2 rounded-l-lg flex items-center gap-3 shadow-lg group hover:bg-red-950/20 transition-colors">
            <div className="flex flex-col items-end">
              <span className="text-red-500 font-bold text-[10px] tracking-widest uppercase leading-tight">
                EMERGENCY
              </span>
              <span className="text-red-500 font-bold text-[10px] tracking-widest uppercase leading-tight">
                EXIT
              </span>
            </div>
            <LogOut className="w-5 h-5 text-red-500 animate-pulse" />
          </div>

          {/* --- SEATING GRID --- */}
          <div className="relative z-10 flex flex-col gap-6 ml-12 md:ml-0">
            {rows.map((row) => {
              const rowSeats = getSeatsByRow(row);
              return (
                <div
                  key={row}
                  className="flex items-center justify-center gap-6"
                >
                  {/* Seats Area */}
                  <div className="flex gap-3 md:gap-5 justify-center">
                    {rowSeats.map((seat) => {
                      return (
                        <div
                          key={`${seat.row}${seat.number}`}
                          className="group relative flex flex-col items-center"
                        >
                          <Armchair
                            className={`
                              w-8 h-8 md:w-10 md:h-10 
                              transition-all duration-300 
                              text-purple-400/70 
                              hover:text-purple-300 
                              cursor-pointer 
                              hover:scale-110 
                              hover:drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]
                              drop-shadow-[0_2px_8px_rgba(168,85,247,0.15)]
                            `}
                            strokeWidth={1.5}
                            fill="rgba(168, 85, 247, 0.08)"
                          />

                          <div
                            className={`
                              absolute -top-10 
                              bg-slate-800/95 backdrop-blur-sm
                              text-white text-xs 
                              px-2.5 py-1.5 
                              rounded-md 
                              border border-slate-700/50
                              shadow-lg shadow-black/20
                              whitespace-nowrap 
                              opacity-0 group-hover:opacity-100 
                              transition-all duration-200
                              z-20 pointer-events-none
                            `}
                          >
                            Row {seat.row} - {seat.number}
                            <div className="text-[10px] text-purple-300 font-semibold mt-0.5">
                              ${seat.seatPrice}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row Label (Right Side) */}
                  <div className="w-8 flex items-center justify-center">
                    <span className="text-slate-500 font-bold text-lg md:text-xl font-mono">
                      {row}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hall;
