import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  cuisine: {
    type: String, // e.g., "Italian", "Indian"
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  priceRange: {
    type: String, // e.g., "$$", "$$$"
    default: "$$",
  },
  // We will use this to help the AI understand what the restaurant offers
  description: {
    type: String,
    default: "A great place to dine.",
  },
  imageUrl: {
    type: String,
    default: "https://via.placeholder.com/400x300", // Placeholder image
  }
}, {
  timestamps: true,
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;