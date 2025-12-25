import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const Home = () => {
  const [bookingsList, setBookingsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookingsList(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault(); 
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings();
    } catch (err) {
      alert("Error deleting booking");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <Link 
          to="/chat" 
          className="bg-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition-all flex items-center gap-2"
        >
          <span>+ New Booking</span>
        </Link>
      </div>

      {bookingsList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-lg">No bookings found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookingsList.map((b) => (
            <Link 
              to={`/details/${b._id}`} 
              key={b._id} 
              className="block bg-white p-6 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100 group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                  {new Date(b.bookingDate).toLocaleDateString()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  b.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {b.status}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-accent transition-colors">
                {b.customerName}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {b.bookingTime} • {b.numberOfGuests} Guests
              </p>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <button 
                  onClick={(e) => handleDelete(b._id, e)}
                  className="text-red-400 hover:text-red-600 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;