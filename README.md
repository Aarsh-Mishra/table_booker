# 🍽️ Vaiu Bistro Voice Agent

An intelligent, voice-activated restaurant booking assistant built with the MERN stack (MongoDB, Express, React, Node.js). Users can discover restaurants, chat with an AI concierge, and confirm reservations. Weather data helps suggest indoor vs outdoor seating.

---

## 📁 Project Structure

```
table_booker/
├── README.md
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── public/
│   └── src/
│       ├── api.js
│       ├── App.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Chat.jsx
│       │   ├── MyBookings.jsx
│       │   └── BookingDetails.jsx
│       └── assets/
└── server/
	├── package.json
	├── index.js
	└── models/
		├── booking.js
		└── restaurant.js
```

---

## 🚀 Key Features

- 🗣️ Voice-like chat: Conversational booking flow handled by an AI agent.
- 🤖 AI-powered: Uses Google Gemini 2.0 Flash via `@google/generative-ai`.
- ☀️ Weather-based suggestions: Integrates OpenWeatherMap to recommend seating.
- 📍 Location-aware: Accepts client-provided coordinates for local forecasts.
- 🧾 Bookings dashboard: View and cancel existing reservations.

---

## 🛠️ Tech Stack

- Frontend: React (Vite), Axios, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)
- AI Model: Google Gemini API
- External APIs: OpenWeatherMap API

---

## ⚙️ Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (Local or Atlas)
- API keys: Google Gemini + OpenWeatherMap

### Environment Variables (server/.env)

```
PORT=5000
MONGO=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
```

---

## 📦 Installation

From the project root:

```bash
cd server
npm install

cd ../client
npm install
```

---

## 🏃 Run the Apps

### Start Backend (Express)

```bash
cd server
node index.js
# Optional (if nodemon installed):
# npx nodemon index.js
```

- Server listens on `http://localhost:5000`.
- On startup, the `Restaurant` collection is cleared and reseeded.

### Start Frontend (Vite)

```bash
cd client
npm run dev
```

- Vite serves the client at `http://localhost:5173` (default).
- The client uses `http://localhost:5000/api` as the API base URL (see `client/src/api.js`).

---

## 🔌 API Endpoints

Base URL: `http://localhost:5000/api`

- `GET /restaurants` — List all restaurants.
- `GET /restaurants/:id` — Get a single restaurant.
- `POST /chat` — AI conversation; returns `reply`, `bookingDetails`, `intent`.
- `GET /bookings` — List all bookings.
- `GET /bookings/:id` — Get one booking.
- `POST /bookings` — Create a booking; accepts either `restaurantId` or `restaurantName`.
- `DELETE /bookings/:id` — Cancel a booking.

---

## 📝 Notes & Tips

- CORS is enabled; ensure the client runs on `localhost:5173` or update policy.
- If using MongoDB Atlas, whitelist your IP and use an SRV connection.
- Ensure valid `GEMINI_API_KEY` and `OPENWEATHER_API_KEY` or weather/AI features will be limited.
- Weather lookup expects a date string (YYYY-MM-DD) and optional `{ lat, lon }` coordinates.

### Windows Tips

- Use PowerShell or Command Prompt to run the commands above.
- If `node` is not recognized, ensure Node.js is added to your PATH and restart the terminal.

---

## ✅ Status

Verified against the current project structure and code:
- Frontend dev script: `npm run dev` (Vite)
- Backend entry: `server/index.js`
- API base URL: `http://localhost:5000/api`
- Environment variables: `PORT`, `MONGO`, `GEMINI_API_KEY`, `OPENWEATHER_API_KEY`
