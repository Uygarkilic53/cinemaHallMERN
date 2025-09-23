const NotFound = () => {
  return (
    // Main container to center content and apply a dark background
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white p-4">
      <div className="flex flex-col items-center p-8 bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-gray-800">
        {/* Not Found Icon (Inline SVG) */}
        <svg
          className="w-24 h-24 text-indigo-500 mb-6 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        {/* Main Heading */}
        <h1 className="text-6xl sm:text-7xl font-bold mb-4 text-indigo-400">
          404
        </h1>

        {/* Subtitle */}
        <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
          Page Not Found
        </h2>

        {/* Descriptive Text */}
        <p className="text-gray-400 mb-8 max-w-xs">
          Looks like you've ventured into uncharted digital territory. The page
          you were looking for doesn't exist.
        </p>

        {/* Back to Home Button */}
        <a
          href="/"
          className="inline-flex items-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 text-white font-medium rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Go Back to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
