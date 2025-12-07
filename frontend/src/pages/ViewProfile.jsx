import { useEffect, useState } from "react";
import axios from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "react-toastify";
import {
  FaUser,
  FaEnvelope,
  FaUserShield,
  FaEdit,
  FaLock,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function ViewProfile() {
  const [user, setUser] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { auth, setAuth } = useAuth();

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

  const handleNameUpdate = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      await axios.put(
        "/auth/update-name",
        { name: newName },
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );

      setUser({ ...user, name: newName });

      // Update auth context - this will update the name everywhere
      const updatedAuth = { ...auth, name: newName };
      setAuth(updatedAuth);
      localStorage.setItem("auth", JSON.stringify(updatedAuth));

      setIsEditingName(false);
      toast.success("Name updated successfully ✅");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update name ❌");
      console.error(err);
    }
  };

  const handlePasswordUpdate = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      await axios.put(
        "/auth/update-password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
      toast.success("Password updated successfully ✅");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update password ❌"
      );
      console.error(err);
    }
  };

  const handleEditNameClick = () => {
    setNewName(user.name);
    setIsEditingName(true);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setNewName("");
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

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
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <FaUserShield className="text-indigo-600 text-5xl mb-2" />
          <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <FaUser className="text-indigo-500 text-xl" />
                <p className="text-gray-500 font-medium text-sm">Full Name</p>
              </div>
              {!isEditingName && (
                <button
                  onClick={handleEditNameClick}
                  className="text-indigo-600 hover:text-indigo-800 transition"
                >
                  <FaEdit className="text-lg" />
                </button>
              )}
            </div>

            {isEditingName ? (
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter new name"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleNameUpdate}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                  >
                    <FaCheck /> Save
                  </button>
                  <button
                    onClick={handleCancelNameEdit}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition flex items-center justify-center gap-2"
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 font-semibold text-lg ml-9">
                {user.name}
              </p>
            )}
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

          {/* Update Password Section */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <FaLock className="text-purple-500 text-xl" />
                <p className="text-gray-500 font-medium text-sm">Password</p>
              </div>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-purple-600 hover:text-purple-800 transition text-sm font-medium"
                >
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Current Password"
                />
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="New Password"
                />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm New Password"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePasswordUpdate}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                  >
                    <FaCheck /> Update
                  </button>
                  <button
                    onClick={handleCancelPasswordChange}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition flex items-center justify-center gap-2"
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
