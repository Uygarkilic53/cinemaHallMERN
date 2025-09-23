import { useState } from "react";
import { FiPlusCircle, FiEdit, FiX } from "react-icons/fi";
import AddMovie from "../../components/Admin/AddMovie";
import UpdateMovie from "../../components/Admin/UpdateMovie";

export default function ManageMovies() {
  const [selectedAction, setSelectedAction] = useState(null);

  const actions = [
    {
      id: "add",
      title: "Add Movie",
      description: "Create and add a new movie to the database",
      icon: <FiPlusCircle className="text-4xl" />,
      buttonClass: "bg-blue-600 hover:bg-blue-700",
      borderClass: "border-blue-500",
      iconBgClass: "bg-blue-100 text-blue-600",
      component: <AddMovie onClose={() => setSelectedAction(null)} />,
    },
    {
      id: "update",
      title: "Update Movie",
      description: "Modify details of existing movies",
      icon: <FiEdit className="text-4xl" />,
      buttonClass: "bg-purple-600 hover:bg-purple-700",
      borderClass: "border-purple-500",
      iconBgClass: "bg-purple-100 text-purple-600",
      component: <UpdateMovie onClose={() => setSelectedAction(null)} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex flex-col items-center py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          Movie Management
        </h1>
        <p className="text-gray-600 max-w-2xl">
          Manage your movie catalog with ease. Add new movies or update existing
          ones.
        </p>
      </div>

      {/* Action Cards */}
      {!selectedAction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl border-t-4 ${action.borderClass}`}
            >
              <div className={`mb-6 p-4 rounded-full ${action.iconBgClass}`}>
                {action.icon}
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                {action.title}
              </h2>
              <p className="text-gray-600 mb-6 flex-grow">
                {action.description}
              </p>
              <button
                onClick={() => setSelectedAction(action)}
                className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-colors ${action.buttonClass}`}
              >
                Select
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            {/* Header with close button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedAction.title}
              </h2>
              <button
                onClick={() => setSelectedAction(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">{selectedAction.component}</div>
          </div>
        </div>
      )}
    </div>
  );
}
