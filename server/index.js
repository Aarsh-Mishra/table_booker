import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Booking from './models/booking.js';
import Restaurant from './models/restaurant.js';
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
    
    // SEED DATA: Ensure we have at least 5 restaurants
    const count = await Restaurant.countDocuments();
    if (count < 5) {
        console.log("Seeding restaurants...");
        // Clear existing to avoid duplicates if re-seeding
        await Restaurant.deleteMany({}); 
        
        await Restaurant.insertMany([
            {
                name: "Bella Italia",
                cuisine: "Italian",
                address: "123 Olive St, Food City",
                rating: 4.8,
                priceRange: "$$$",
                description: "Authentic wood-fired pizzas and handmade pasta.",
                imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
            },
            {
                name: "Spice Route",
                cuisine: "Indian",
                address: "45 Curry Lane, Flavor Town",
                rating: 4.6,
                priceRange: "$$",
                description: "Rich curries and tandoori specials.",
                imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=800&q=80"
            },
            {
                name: "Sushi Zen",
                cuisine: "Japanese",
                address: "88 Blossom Ave, Zen District",
                rating: 4.9,
                priceRange: "$$$$",
                description: "Premium sushi and sashimi experiences.",
                imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80"
            },
            {
                name: "The Burger Joint",
                cuisine: "American",
                address: "101 Grill Rd, Meatpacking Dist",
                rating: 4.4,
                priceRange: "$",
                description: "Juicy handcrafted burgers and milkshakes.",
                imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
            },
            {
                name: "El Camino",
                cuisine: "Mexican",
                address: "55 Fiesta Way, Southside",
                rating: 4.7,
                priceRange: "$$",
                description: "Authentic street tacos and margaritas.",
                imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80"
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
    if (!apiKey) return null;

    let url = '';
    if (location && location.lat && location.lon) {
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`;
    } else {
        url = `https://api.openweathermap.org/data/2.5/forecast?q=New York&appid=${apiKey}&units=metric`;
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
    return null;
  }
};

// --- ROUTES ---

app.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch restaurants" });
    }
});

app.get('/api/restaurants/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ error: "Error fetching restaurant" });
    }
});

// --- CORE ROUTE: AI Chat Processing ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, userLocation, contextRestaurantId } = req.body;

    // 1. Fetch ALL Restaurants for the AI's "Brain"
    // We create a directory string so the AI knows what options exist
    const allRestaurants = await Restaurant.find({}, 'name cuisine rating priceRange');
    const restaurantDirectory = allRestaurants.map(r => 
        `- ${r.name} (Cuisine: ${r.cuisine}, Rating: ${r.rating}★, Price: ${r.priceRange})`
    ).join('\n');

    // 2. Determine Context
    let restaurantContext = `You are a restaurant concierge. 
    Here is the list of restaurants available in your system:
    ${restaurantDirectory}`;

    if (contextRestaurantId) {
        const restaurant = await Restaurant.findById(contextRestaurantId);
        if (restaurant) {
            restaurantContext += `\n\nUSER CONTEXT: The user is currently looking at "${restaurant.name}". Assume this is the restaurant they want unless they say otherwise.`;
        }
    }

    // 3. Format History
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
    
    YOUR GOAL: Help the user discover restaurants or book a table.

    RULES FOR DISCOVERY:
    1. If the user asks for "Italian food" or "best rated places", use the 'list of restaurants' provided above to make recommendations.
    2. Always suggest at least 2-3 options if the query is general.

    RULES FOR BOOKING (Strict):
    To make a booking, you MUST explicitly collect ALL of the following details. Do not assume them.
    1. **Restaurant Name**: (Which one?)
    2. **Customer Name**: (Ask: "What is the name for the reservation?")
    3. **Date & Time**: (When?)
    4. **Number of Guests**: (How many people?)
    5. **Seating Preference**: (Ask: "Would you prefer Indoor or Outdoor seating?")

    LOGIC:
    - If any of the 5 items above are missing, ASK for them.
    - If the user asks "Do you have Italian?", say "Yes, we have Bella Italia..." and ask if they want to book there.
    - Only set "intent" to "confirmed" when ALL 5 details are collected AND the user says "Yes/Confirm".

    Return JSON ONLY:
    {
      "reply": "Your response.",
      "bookingDetails": {
        "restaurantName": "extracted or null",
        "name": "extracted or null",
        "date": "extracted (YYYY-MM-DD) or null",
        "time": "extracted or null",
        "guests": "extracted or null",
        "seating": "extracted or null"
      },
      "intent": "discovery" | "booking_request" | "confirmation_request" | "confirmed"
    }
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);

    // Weather Logic
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
                     if (weather.condition.includes('rain') && !aiData.bookingDetails.seating) {
                        aiData.reply += " Outdoor seating might be wet, I recommend Indoor.";
                     }
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

app.post('/api/bookings', async (req, res) => {
  try {
    const { restaurantId, restaurantName, ...bookingData } = req.body;
    
    let targetRestaurantId = restaurantId;

    // If we only have the name (from Voice Chat), find the ID
    if (!targetRestaurantId && restaurantName) {
        const r = await Restaurant.findOne({ name: new RegExp(restaurantName, 'i') });
        if (r) targetRestaurantId = r._id;
    }

    if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant not identified" });
    }

    const newBooking = new Booking({ ...bookingData, restaurantId: targetRestaurantId });
    await newBooking.save();
    res.status(201).json({ message: "Booking confirmed!", booking: newBooking });
  } catch (error){
    console.error(error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
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