# 🍽️ Vaiu Bistro Voice Agent

An intelligent, voice-activated restaurant booking assistant built with the MERN stack (MongoDB, Express, React, Node.js). This application allows users to book tables via natural conversation, offers real-time weather-based seating suggestions, and includes an admin dashboard to manage bookings.

---

## 🚀 Key Features

- 🗣️ Voice Interaction: Seamless Speech-to-Text (Input) and Text-to-Speech (Response) using the Web Speech API.
- 🤖 AI-Powered: Powered by Google Gemini 2.0 Flash for natural language understanding and smart data extraction.
- ☀️ Weather Integration: Fetches real-time forecasts via OpenWeatherMap to intelligently suggest Indoor vs. Outdoor seating.
- 📍 Location Aware: Automatically detects user location for accurate local weather data.
- ⚡ Auto-Confirmation: Detects user intent to "confirm" and saves bookings automatically to the database.
- 📊 Admin Dashboard: A visual interface to view all bookings and cancel/delete them as needed.

---

## 🛠️ Tech Stack

- Frontend: React (Vite), Axios, Web Speech API, CSS Modules
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)
- AI Model: Google Gemini API
- External APIs: OpenWeatherMap API

---

## ⚙️ Setup Guide

### 1. Prerequisites

Ensure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- Google Gemini API Key
- OpenWeatherMap API Key

---

### 2. Environment Variables (Backend)

Create a `.env` file inside the `server/` folder:

PORT=5000  
MONGO=your_mongodb_connection_string  
GEMINI_API_KEY=your_google_gemini_api_key  
OPENWEATHER_API_KEY=your_openweather_api_key  

---

## 📦 Installation

### Install Backend

cd server  
npm install  

### Install Frontend

cd client  
npm install  

---

## 🏃‍♂️ How to Run

### Start Backend

cd server  
node index.js  
(Server will run at http://localhost:5000)

### Start Frontend

cd client  
npm run dev  
(Client will run at http://localhost:5173 or similar)
