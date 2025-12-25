import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

const BookingDetails = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    api.get(`/bookings/${id}`)
       .then(res => setBooking(res.data))
       .catch(err => console.error(err));
  }, [id]);

  if (!booking) return <div className="p-10 text-center">Loading details...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/" className="text-gray-400 hover:text-gray-600 mb-6 inline-block">← Back to Dashboard</Link>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-primary p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{booking.customerName}</h2>
            <p className="opacity-80 text-sm">ID: {booking._id}</p>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-lg text-sm backdrop-blur-sm">
            {booking.status}
          </span>
        </div>
        <div className="p-8 grid grid-cols-2 gap-y-6 gap-x-4">
          <DetailItem label="Date" value={new Date(booking.bookingDate).toDateString()} />
          <DetailItem label="Time" value={booking.bookingTime} />
          <DetailItem label="Guests" value={booking.numberOfGuests} />
          <DetailItem label="Seating" value={booking.seatingPreference} />
          <DetailItem label="Cuisine" value={booking.cuisinePreference} />
          <div className="col-span-2">
            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Special Requests</span>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
              {booking.specialRequests}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div>
    <span className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</span>
    <span className="text-lg font-medium text-gray-800">{value}</span>
  </div>
);

export default BookingDetails;