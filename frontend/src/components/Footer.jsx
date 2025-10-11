import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <h2 className="text-xl font-bold text-white">🎬 CinemaHall</h2>
          <p className="mt-2 text-sm text-gray-400">
            Book your favorite movies and enjoy a modern cinema experience.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-white font-semibold">Quick Links</h3>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <a href="/movies" className="hover:text-white transition">
                Movies
              </a>
            </li>
            <li>
              <a href="/halls" className="hover:text-white transition">
                Halls
              </a>
            </li>
            <li>
              <a
                href="/my-reservations"
                className="hover:text-white transition"
              >
                My Reservations
              </a>
            </li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-white font-semibold">Follow Us</h3>
          <div className="flex space-x-4 mt-2">
            <a href="#" className="hover:text-white">
              <FaFacebook size={20} />
            </a>
            <a href="#" className="hover:text-white">
              <FaTwitter size={20} />
            </a>
            <a href="#" className="hover:text-white">
              <FaInstagram size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} CinemaHall. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
