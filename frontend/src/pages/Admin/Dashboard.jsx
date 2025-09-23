import { useNavigate } from "react-router-dom";
import { FaFilm, FaBuilding, FaClipboardList } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const cards = [
    {
      title: "Manage Halls",
      icon: <FaBuilding size={40} />,
      route: "/admin/managehall",
      gradient: "from-indigo-500 to-purple-600",
    },
    {
      title: "Manage Movies",
      icon: <FaFilm size={40} />,
      route: "/admin/managemovies",
      gradient: "from-green-400 to-teal-500",
    },
    {
      title: "Manage Reservations",
      icon: <FaClipboardList size={40} />,
      route: "/admin/managereservations",
      gradient: "from-yellow-400 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 text-lg">
          {auth?.name
            ? `Welcome back, ${auth.name}! Manage your cinema effectively.`
            : "Welcome back, Admin! Manage your cinema effectively."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.route)}
            className={`cursor-pointer flex flex-col items-center justify-center p-8 rounded-2xl shadow-lg text-white bg-gradient-to-r ${card.gradient} hover:scale-105 transition transform duration-300`}
          >
            <div className="mb-4">{card.icon}</div>
            <h2 className="text-2xl font-semibold">{card.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
