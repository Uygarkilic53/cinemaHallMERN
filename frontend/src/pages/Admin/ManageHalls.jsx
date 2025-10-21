import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaSeedling, FaTheaterMasks, FaChair } from "react-icons/fa";
import { MdWarning } from "react-icons/md";
import api from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";

const ManageHalls = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    hallId: null,
    hallName: "",
  });
  const [seedModal, setSeedModal] = useState({ show: false, force: false });

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    setLoading(true);
    try {
      const response = await api.get("/halls/get-halls");
      if (response.data.success) {
        setHalls(response.data.halls);
        if (response.data.halls.length === 0) {
          toast.info("No halls found. Consider seeding halls.");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch halls");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (hall) => {
    setDeleteModal({ show: true, hallId: hall._id, hallName: hall.name });
  };

  const confirmDelete = async () => {
    try {
      const response = await api.delete(
        `/halls/delete-hall/${deleteModal.hallId}`
      );
      toast.success(`Hall "${deleteModal.hallName}" deleted successfully`);
      setDeleteModal({ show: false, hallId: null, hallName: "" });
      fetchHalls();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete hall");
    }
  };

  const handleSeedClick = () => {
    setSeedModal({ show: true, force: false });
  };

  const confirmSeed = async (force = false) => {
    try {
      const response = await api.post(
        `/halls/seed-halls${force ? "?force=true" : ""}`
      );
      toast.success(response.data.message);
      setSeedModal({ show: false, force: false });
      fetchHalls();
    } catch (error) {
      if (error.response?.status === 400) {
        setSeedModal({ show: true, force: true });
        toast.warning("Halls already exist. Do you want to reseed?");
      } else {
        toast.error(error.response?.data?.error || "Failed to seed halls");
        setSeedModal({ show: false, force: false });
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Halls" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-4 rounded-xl">
                <FaTheaterMasks className="text-purple-600 text-3xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Manage Halls
                </h1>
                <p className="text-gray-600 mt-1">
                  {halls.length} {halls.length === 1 ? "hall" : "halls"}{" "}
                  available
                </p>
              </div>
            </div>
            <button
              onClick={handleSeedClick}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaSeedling />
              <span>Seed Halls</span>
            </button>
          </div>
        </div>

        {/* Halls List */}
        {halls.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <FaTheaterMasks className="text-gray-300 text-6xl mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              No Halls Found
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by seeding some halls
            </p>
            <button
              onClick={handleSeedClick}
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              <FaSeedling />
              <span>Seed Halls Now</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {halls.map((hall) => (
              <div
                key={hall._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-6 flex-1">
                    <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-4 rounded-xl">
                      <FaTheaterMasks className="text-purple-600 text-2xl" />
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-8">
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">
                          Hall Name
                        </p>
                        <p className="text-xl font-bold text-gray-800">
                          {hall.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">
                          Total Seats
                        </p>
                        <div className="flex items-center space-x-2">
                          <FaChair className="text-blue-600" />
                          <p className="text-xl font-bold text-gray-800">
                            {hall.totalSeats}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">
                          Hall ID
                        </p>
                        <p className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-1 rounded-lg inline-block">
                          {hall._id.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteClick(hall)}
                    className="ml-6 bg-red-50 text-red-600 p-4 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-200 transform hover:scale-110 group"
                    title="Delete Hall"
                  >
                    <FaTrash className="text-xl" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-scale">
            <div className="text-center">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdWarning className="text-red-600 text-4xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Delete Hall?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-800">
                  "{deleteModal.hallName}"
                </span>
                ?
                <br />
                <span className="text-red-600 font-semibold">
                  This action cannot be undone.
                </span>
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() =>
                    setDeleteModal({ show: false, hallId: null, hallName: "" })
                  }
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seed Confirmation Modal */}
      {seedModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-scale">
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSeedling className="text-green-600 text-4xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {seedModal.force ? "Reseed Halls?" : "Seed Halls?"}
              </h3>
              <p className="text-gray-600 mb-6">
                {seedModal.force ? (
                  <>
                    Halls already exist. Reseeding will{" "}
                    <span className="font-bold text-red-600">
                      delete all existing halls
                    </span>{" "}
                    and create new ones.
                    <br />
                    <span className="text-red-600 font-semibold">
                      This action cannot be undone.
                    </span>
                  </>
                ) : (
                  "This will create default halls in your database."
                )}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSeedModal({ show: false, force: false })}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmSeed(seedModal.force)}
                  className={`flex-1 ${
                    seedModal.force
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white px-6 py-3 rounded-xl font-semibold transition-colors`}
                >
                  {seedModal.force ? "Reseed" : "Seed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale {
          animation: scale 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ManageHalls;
