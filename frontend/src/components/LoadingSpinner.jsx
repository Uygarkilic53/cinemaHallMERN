export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-4 border-blue-300 border-b-transparent rounded-full animate-spin-reverse absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-lg text-gray-600">{message}</p>
      </div>
    </div>
  );
}
