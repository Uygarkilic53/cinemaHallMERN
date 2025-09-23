import { useEffect, useState } from "react";
import axios from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaUserShield } from "react-icons/fa";

export default function ViewProfile() {
  const [user, setUser] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/auth/profile", {
          headers: { Authorization: `Bearer ${auth?.token}` },
        });
        setUser(res.data);
      } catch (err) {
        toast.error("Failed to load profile ❌");
        console.error(err);
      }
    };

    if (auth?.token) {
      fetchProfile();
    }
  }, [auth]);

  if (!auth?.token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-lg">
          You need to log in to view your profile.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <FaUserShield className="text-indigo-600 text-5xl mb-2" />
          <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
            <FaUser className="text-indigo-500 text-xl" />
            <div>
              <p className="text-gray-500 font-medium text-sm">Full Name</p>
              <p className="text-gray-800 font-semibold text-lg">{user.name}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
            <FaEnvelope className="text-green-500 text-xl" />
            <div>
              <p className="text-gray-500 font-medium text-sm">Email</p>
              <p className="text-gray-800 font-semibold text-lg">
                {user.email}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
            <FaUserShield className="text-red-500 text-xl" />
            <div>
              <p className="text-gray-500 font-medium text-sm">Role</p>
              <p
                className={`font-semibold text-lg ${
                  user.role === "admin" ? "text-red-500" : "text-blue-500"
                }`}
              >
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
