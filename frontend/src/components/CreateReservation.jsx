// src/components/CreateReservation.jsx
import { useEffect, useState } from "react";
import { FaClock, FaTimes, FaCreditCard } from "react-icons/fa";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import api from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import SeatSelector from "./SeatSelector";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Custom styling for CardElement
const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
  hidePostalCode: false,
};

export default function CreateReservation({ movie, hallId, onClose }) {
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [hallData, setHallData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [price, setPrice] = useState(0);

  // Fetch seats after selecting a showtime
  useEffect(() => {
    const fetchSeats = async () => {
      if (!selectedShowtime || !hallId) return;

      try {
        setLoading(true);
        const res = await api.get(
          `/movies/${movie._id}/halls/${hallId}/showtimes/${encodeURIComponent(
            selectedShowtime
          )}/seats`
        );
        setHallData(res.data);
        setSelectedSeats([]);
      } catch (err) {
        console.error("Error loading seats:", err);
        setHallData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [selectedShowtime, hallId, movie._id]);

  useEffect(() => {
    if (hallData) {
      const pricePerSeat = hallData?.seats?.[0]?.seatPrice || 20;
      setPrice(selectedSeats.length * pricePerSeat);
    }
  }, [selectedSeats, hallData]);

  const toggleSeatSelection = (seat) => {
    if (seat.isReserved) return;
    const alreadySelected = selectedSeats.some(
      (s) => s.row === seat.row && s.number === seat.number
    );
    if (alreadySelected) {
      setSelectedSeats((prev) =>
        prev.filter((s) => !(s.row === seat.row && s.number === seat.number))
      );
    } else {
      setSelectedSeats((prev) => [...prev, seat]);
    }
  };

  return (
    <Elements stripe={stripePromise}>
      <ReservationForm
        movie={movie}
        hallId={hallId}
        hallData={hallData}
        selectedShowtime={selectedShowtime}
        setSelectedShowtime={setSelectedShowtime}
        selectedSeats={selectedSeats}
        toggleSeatSelection={toggleSeatSelection}
        loading={loading}
        onClose={onClose}
        price={price}
      />
    </Elements>
  );
}

function ReservationForm({
  movie,
  hallId,
  hallData,
  selectedShowtime,
  setSelectedShowtime,
  selectedSeats,
  toggleSeatSelection,
  loading,
  onClose,
  price,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const handleReservation = async () => {
    if (!stripe || !elements) {
      alert("Stripe is not loaded yet. Please try again.");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    if (!cardComplete) {
      alert("Please enter complete card details.");
      return;
    }

    setProcessing(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      // Step 1: Create PaymentIntent
      const { data } = await api.post("/reservations/create-reservation", {
        movieId: movie._id,
        hallId,
        showtime: selectedShowtime,
        date: today,
        seats: selectedSeats,
      });

      const { clientSecret, paymentIntentId } = data;

      // Step 2: Confirm Card Payment
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: "Movie Theater Customer", // You can get this from user input if needed
            },
          },
        }
      );

      if (error) {
        console.error("Payment error:", error);
        alert(`Payment failed: ${error.message}`);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // Step 3: Confirm Reservation in backend
        await api.post("/reservations/confirm-reservation", {
          paymentIntentId,
        });
        alert("Payment successful! Your seats have been reserved.");
        onClose();
      } else {
        alert("Payment was not successful. Please try again.");
      }
    } catch (err) {
      console.error("Reservation error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Reservation failed";
      alert(`Error: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  // Check if showtime is in the past
  const isPast = (timeStr) => {
    const [hour, minute] = timeStr.split(":").map(Number);
    const now = new Date();
    const showtimeDate = new Date();
    showtimeDate.setHours(hour, minute, 0, 0);
    return showtimeDate < now;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="relative p-6 bg-white rounded-xl shadow-lg max-w-3xl w-full space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 z-10"
        >
          <FaTimes size={20} />
        </button>

        {/* Movie card */}
        <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-3">
          {movie.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
              alt={movie.title}
              className="w-20 h-28 object-cover rounded"
            />
          ) : (
            <div className="w-20 h-28 bg-gray-300 flex items-center justify-center text-gray-500 rounded">
              No Image
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-bold">{movie.title}</h3>
            <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
              <FaClock /> {movie.duration} min
            </p>
            <p className="text-sm text-gray-700 mt-1">
              {movie.genre?.join(", ")}
            </p>
          </div>
        </div>

        {/* Showtimes */}
        <div className="flex flex-wrap gap-3">
          {movie.showtimes.map((st) => {
            const timeStr = new Date(st).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            const past = isPast(timeStr);

            return (
              <button
                key={timeStr}
                disabled={past}
                onClick={() => setSelectedShowtime(timeStr)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  selectedShowtime === timeStr
                    ? "bg-blue-600 text-white"
                    : past
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {timeStr}
              </button>
            );
          })}
        </div>

        {loading && <LoadingSpinner message="Loading seats..." />}

        {selectedShowtime && !loading && hallData && (
          <>
            {/* Seat layout */}
            <SeatSelector
              seats={hallData.seats}
              reservedSeats={hallData.seats.filter((s) => s.isReserved)}
              selectedSeats={selectedSeats}
              onToggleSeat={toggleSeatSelection}
              showScreen={true}
            />

            {/* Selected seats summary */}
            {selectedSeats.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Selected Seats:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat, index) => (
                    <span
                      key={index}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Row {seat.row} - Seat {seat.number}
                    </span>
                  ))}
                </div>
                <p className="mt-2 font-bold text-blue-800">
                  Total: ${price} ({selectedSeats.length} seat
                  {selectedSeats.length !== 1 ? "s" : ""})
                </p>
              </div>
            )}

            {/* Payment Section - Only show if seats are selected */}
            {selectedSeats.length > 0 && (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <FaCreditCard className="text-blue-600" />
                  <h4 className="font-semibold text-gray-800">
                    Payment Information
                  </h4>
                </div>

                <div className="bg-white p-3 rounded border">
                  <CardElement
                    options={cardElementOptions}
                    onChange={handleCardChange}
                  />
                </div>

                {cardError && (
                  <div className="text-red-600 text-sm mt-2">{cardError}</div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Your payment is secured by Stripe. We do not store your card
                  details.
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                disabled={processing}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReservation}
                disabled={
                  selectedSeats.length === 0 ||
                  processing ||
                  !cardComplete ||
                  !stripe ||
                  !elements
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ${price} for {selectedSeats.length} seat
                    {selectedSeats.length !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
