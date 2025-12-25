import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Booking from './models/booking.js';
import Restaurant from './models/restaurant.js'; // Import new model
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// --- Configuration ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// --- Database Connection & Seeding ---
mongoose.connect(process.env.MONGO).then(async () => {
    console.log('Connected to MongoDB!');
    
    // SEED DATA: If no restaurants exist, create some defaults
    const count = await Restaurant.countDocuments();
    if (count === 0) {
        console.log("Seeding initial restaurants...");
        await Restaurant.insertMany([
            {
                name: "Bella Italia",
                cuisine: "Italian",
                address: "123 Olive St, Food City",
                rating: 4.8,
                priceRange: "5k",
                description: "Authentic wood-fired pizzas and handmade pasta.",
                imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
            },
            {
                name: "Spice Route",
                cuisine: "Indian",
                address: "45 Curry Lane, Flavor Town",
                rating: 4.6,
                priceRange: "2k",
                description: "Rich curries and tandoori specials.",
                imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=800&q=80"
            },
            {
                name: "Sushi Zen",
                cuisine: "Japanese",
                address: "88 Blossom Ave, Zen District",
                rating: 4.9,
                priceRange: "10k",
                description: "Premium sushi and sashimi experiences.",
                imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80"
            }
        ]);
        console.log("Restaurants seeded!");
    }

}).catch((err) => {
    console.error('MongoDB Connection Error:', err);
});

// --- AI Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- Helper: Weather ---
const getWeather = async (dateStr, location) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return null; // Handle missing key gracefully

    let url = '';
    if (location && location.lat && location.lon) {
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`;
    } else {
        const city = 'Trichy'; // Default fallback
        url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    }

    const response = await axios.get(url);
    const list = response.data.list;
    const targetDate = dateStr; 
    const forecast = list.find(item => item.dt_txt.includes(targetDate));

    if (!forecast) return null;

    return {
      condition: forecast.weather[0].description,
      temp: forecast.main.temp,
      found: true
    };
  } catch (error) {
    console.error("Weather API Error (Ignoring):", error.message);
    return null;
  }
};

// --- NEW ROUTES: Restaurant Discovery ---

// 1. Get All Restaurants
app.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch restaurants" });
    }
});

// 2. Get Single Restaurant
app.get('/api/restaurants/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ error: "Error fetching restaurant" });
    }
});

// --- CORE ROUTE: AI Chat Processing (UPDATED) ---
app.post('/api/chat', async (req, res) => {
  try {
    // contextRestaurantId: The ID of the restaurant the user is CURRENTLY looking at (if any)
    const { message, history, userLocation, contextRestaurantId } = req.body;

    // Fetch the specific restaurant details if an ID is provided
    let restaurantContext = "You are a general restaurant booking assistant. Users can book at various restaurants.";
    if (contextRestaurantId) {
        const restaurant = await Restaurant.findById(contextRestaurantId);
        if (restaurant) {
            restaurantContext = `You are the booking assistant for "${restaurant.name}". 
            Cuisine: ${restaurant.cuisine}. 
            Address: ${restaurant.address}. 
            Price: ${restaurant.priceRange}.
            Description: ${restaurant.description}.`;
        }
    }

    // Format History
    let conversationContext = "";
    if (history && history.length > 0) {
        conversationContext = history.map(msg => {
            const role = msg.sender === 'user' ? "User" : "Agent";
            return `${role}: ${msg.text}`;
        }).join("\n");
    }

    const systemPrompt = `
    ${restaurantContext}
    Today's date is ${new Date().toISOString().split('T')[0]}.
    
    HISTORY:
    ${conversationContext}
    
    CURRENT USER MESSAGE: "${message}"
    
    YOUR GOAL:
    You are a restaurant booking assistant.
    
    CRITICAL RULES:
    1. **RESTAURANT CHECK**: Do you know which restaurant the user wants? 
       - If "contextRestaurantId" was provided, you know it.
       - If NOT, check the history. Has the user explicitly named a restaurant?
       - If NO restaurant is identified, your ONLY goal is to ask: "Which restaurant would you like to book at?" DO NOT ask for date/time yet.
    
    2. Once the restaurant is known, collect: Name, Date, Time, Guests, Seating.
    3. If ALL details are present AND user confirms, set intent to "confirmed".

    Return JSON ONLY:
    {
      "reply": "Your response.",
      "bookingDetails": {
        "restaurantName": "extracted restaurant name or null",
        "name": "extracted user name or null",
        "date": "extracted (YYYY-MM-DD) or null",
        "time": "extracted or null",
        "guests": "extracted or null",
        "seating": "extracted or null"
      },
      "intent": "restaurant_selection" | "booking_request" | "confirmation_request" | "confirmed"
    }
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);

    // Weather Logic (Keep existing logic)
    if (aiData.bookingDetails.date) {
        const weatherAlreadyDiscussed = history?.some(msg => 
            msg.sender === 'bot' && 
            (msg.text.toLowerCase().includes('forecast') || msg.text.toLowerCase().includes('weather'))
        );
        
        if (!weatherAlreadyDiscussed) {
             const weather = await getWeather(aiData.bookingDetails.date, userLocation);
             if (weather && weather.found) {
                 if (!aiData.reply.toLowerCase().includes('weather')) {
                     aiData.reply += ` Forecast: ${weather.condition}, ${Math.round(weather.temp)}°C.`;
                 }
             }
        }
    }

    res.json(aiData);

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// --- CRUD ROUTES (UPDATED) ---

app.post('/api/bookings', async (req, res) => {
  try {
    const { restaurantId, ...bookingData } = req.body;
    
    // Validate Restaurant ID
    if (!restaurantId) {
        return res.status(400).json({ error: "Restaurant ID is required for booking" });
    }

    const newBooking = new Booking({ ...bookingData, restaurantId });
    await newBooking.save();
    res.status(201).json({ message: "Booking confirmed!", booking: newBooking });
  } catch (error){
    console.error(error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    // Populate restaurant details so we can show the name in the dashboard
    const bookings = await Booking.find().populate('restaurantId').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking cancelled" });
  } catch (error) {
    res.status(500).json({ error: "Error cancelling" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});