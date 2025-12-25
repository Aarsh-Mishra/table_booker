import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/restaurants');
      setRestaurants(res.data);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (restaurant) => {
    // Navigate to Chat, passing the selected restaurant ID and Name in the state
    navigate('/chat', { state: { restaurantId: restaurant._id, restaurantName: restaurant.name } });
  };

  if (loading) return <div className="text-center mt-20">Loading restaurants...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Discover Restaurants</h2>
          <p className="text-gray-500 mt-1">Find the perfect table for tonight.</p>
        </div>
        {/* Helper link to see old dashboard if needed, or we can move this to a new route later */}
        <Link to="/chat" className="text-sm text-primary font-medium hover:underline">
          Talk to General Agent &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {restaurants.map((r) => (
          <div key={r._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 overflow-hidden bg-gray-200">
              <img 
                src={r.imageUrl} 
                alt={r.name} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-900">{r.name}</h3>
                <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-bold">
                  ★ {r.rating}
                </span>
              </div>
              
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                {r.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500 font-medium mb-6">
                <span className="bg-gray-100 px-2 py-1 rounded">{r.cuisine}</span>
                <span>{r.priceRange}</span>
                <span>{r.address.split(',')[0]}</span>
              </div>

              <button 
                onClick={() => handleBookClick(r)}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <span>🎙️ Book with AI</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;