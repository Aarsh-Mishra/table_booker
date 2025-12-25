import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings(); // Refresh list
    } catch (err) {
      alert("Failed to cancel booking");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading your bookings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">My Bookings</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">You haven't booked any tables yet.</p>
          <Link to="/" className="text-blue-600 font-medium hover:underline">Find a Restaurant</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {b.restaurantId?.name || "Unknown Restaurant"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {new Date(b.bookingDate).toLocaleDateString()} at {b.bookingTime} • {b.numberOfGuests} Guests
                </p>
                <div className="mt-2 flex gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    b.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.status}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 text-xs rounded">
                    {b.restaurantId?.address}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                 <Link 
                  to={`/details/${b._id}`}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  View Details
                </Link>
                <button 
                  onClick={() => handleCancel(b._id)}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;