export default function LoadingSpinner({ message = "Loading" }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        {/* Spinner Circle */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
        </div>

        {/* Message */}
        <div className="flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-700">{message}</span>
        </div>
      </div>
    </div>
  );
}
