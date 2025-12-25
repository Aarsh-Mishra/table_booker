import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Booking from './models/booking.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// --- Configuration ---
dotenv.config(); // Load environment variables from .env
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(express.json()); // Allow parsing JSON bodies
app.use(cors()); // Enable CORS for frontend communication

// --- Database Connection ---
mongoose.connect(process.env.MONGO).then(() => {
    console.log('Connected to MongoDB!');
}).catch((err) => {
    console.error('MongoDB Connection Error:', err);
});

// --- AI Setup (Gemini) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// We use the flash model for faster response times suitable for voice agents
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- Helper Function: Get Real-Time Weather ---
/**
 * Fetches weather forecast from OpenWeatherMap.
 * 1. Uses dynamic Lat/Lon if provided by the client.
 * 2. Filters the 5-day forecast list to find the specific booking date.
 */
const getWeather = async (dateStr, location) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    let url = '';

    // Logic: Use user's geo-coordinates if allowed, else fallback to a default city
    if (location && location.lat && location.lon) {
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`;
    } else {
        const city = 'Trichy'; // Default fallback
        url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    }

    const response = await axios.get(url);
    const list = response.data.list;

    // Logic: OpenWeatherMap returns data in 3-hour intervals. 
    // We search the array for an entry that matches the user's requested booking date (YYYY-MM-DD).
    const targetDate = dateStr; 
    const forecast = list.find(item => item.dt_txt.includes(targetDate));

    // If the date is too far in the future (beyond 5 days), API won't have it.
    if (!forecast) return null;

    return {
      condition: forecast.weather[0].description, // e.g., "light rain"
      temp: forecast.main.temp,
      found: true
    };

  } catch (error) {
    console.error("Weather API Error:", error.message);
    return null;
  }
};

// --- CORE ROUTE: AI Chat Processing ---
app.post('/api/chat', async (req, res) => {
  try {
    // We receive the user's message, conversation history, and their location
    const { message, history, userLocation } = req.body;

    // 1. Context Construction
    // We format previous messages so the AI knows what has already been said.
    let conversationContext = "";
    if (history && history.length > 0) {
        conversationContext = history.map(msg => {
            const role = msg.sender === 'user' ? "User" : "Agent";
            return `${role}: ${msg.text}`;
        }).join("\n");
    }

    // 2. System Prompt Engineering
    // This tells the AI its role, the current date, and the strict JSON format it must output.
    const systemPrompt = `
    You are a helpful restaurant booking assistant for "Vaiu Bistro".
    Today's date is ${new Date().toISOString().split('T')[0]}.
    
    HISTORY:
    ${conversationContext}
    
    CURRENT USER MESSAGE: "${message}"
    
    YOUR GOAL:
    Collect: Name, Date, Time, Guests, Seating (Indoor/Outdoor), Cuisine, Special Requests.

    LOGIC:
    1. Compare HISTORY and CURRENT MESSAGE to find details.
    2. If a detail is missing, ASK for it politely.
    3. If ALL details are present but user hasn't explicitly said "yes" or "confirm" to finalize, set intent to "confirmation_request".
    4. If ALL details are present AND the user says "yes", "confirm", "go ahead", or similar to finalize, set intent to "confirmed".
    
    Return JSON ONLY:
    {
      "reply": "Your conversational response.",
      "bookingDetails": {
        "name": "extracted or null",
        "date": "extracted (YYYY-MM-DD) or null",
        "time": "extracted or null",
        "guests": "extracted or null",
        "seating": "extracted or null",
        "cuisine": "extracted or null",
        "specialRequests": "extracted or null"
      },
      "intent": "booking_request" | "confirmation_request" | "confirmed"
    }
    `;

    // 3. Generate AI Response
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    // Clean up the response (sometimes AI adds markdown code blocks)
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);

    // 4. Smart Weather Logic
    // We only fetch weather if we have a valid date.
    if (aiData.bookingDetails.date) {
        // Check History: Has the bot ALREADY mentioned the weather? 
        // We filter the history to stop the bot from repeating the forecast endlessly.
        const weatherAlreadyDiscussed = history?.some(msg => 
            msg.sender === 'bot' && 
            (msg.text.toLowerCase().includes('forecast') || msg.text.toLowerCase().includes('weather'))
        );
        
        if (!weatherAlreadyDiscussed) {
             // Pass the user's location to our helper function
             const weather = await getWeather(aiData.bookingDetails.date, userLocation);
             
             // If valid weather data is found, append it to the AI's reply
             if (weather && weather.found) {
                 // Double check: AI might have hallucinated a weather report in "reply" already.
                 if (!aiData.reply.toLowerCase().includes('weather') && !aiData.reply.toLowerCase().includes('forecast')) {
                     aiData.reply += ` By the way, the forecast for that day is ${weather.condition} with ${Math.round(weather.temp)}°C.`;
                     
                     // Logic: Suggest Indoor seating if it is raining
                     if (weather.condition.includes('rain') && !aiData.bookingDetails.seating) {
                         aiData.reply += " I recommend indoor seating.";
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

// --- CRUD ROUTES for Booking Management ---

// Create a new booking (Triggered automatically by frontend on 'confirmed' intent)
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    const newBooking = new Booking(bookingData);
    await newBooking.save();
    res.status(201).json({ message: "Booking confirmed!", booking: newBooking });
  } catch (error){
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// Get all bookings (For the Dashboard View)
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }); // Newest first
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Get a specific booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: "Error fetching booking" });
  }
});

// Cancel/Delete a booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error cancelling booking" });
  }
});

// Base Route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});