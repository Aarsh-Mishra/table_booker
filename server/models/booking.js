import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
 
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant', 
    required: true,
  },
  // -----------------
  customerName: {
    type: String,
    required: true,
  },
  numberOfGuests: {
    type: Number,
    required: true,
  },
  bookingDate: {
    type: Date, 
    required: true,
  },
  bookingTime: {
    type: String, 
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
  timestamps: true, 
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;