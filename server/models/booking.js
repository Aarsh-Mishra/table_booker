import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  numberOfGuests: {
    type: Number,
    required: true,
  },
  bookingDate: {
    type: Date, // Stores both date and time ideally, or just date
    required: true,
  },
  bookingTime: {
    type: String, // e.g., "19:00" or "7 PM"
    required: true,
  },
  cuisinePreference: {
    type: String,
    default: 'Any',
  },
  specialRequests: {
    type: String,
    default: 'None',
  },
  // We store the weather data we fetched at the time of booking
  weatherInfo: {
    type: Object, 
    default: {},
  },
  seatingPreference: {
    type: String,
    enum: ['Indoor', 'Outdoor', 'Any', 'indoor', 'outdoor', 'any'],
    default: 'Any',
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Cancelled'],
    default: 'Pending',
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;