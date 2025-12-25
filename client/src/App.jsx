import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import BookingDetails from './pages/BookingDetails';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        
        {/* Navigation Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <span className="text-2xl">🍽️</span>
              <h1 className="text-xl font-bold tracking-tight">Vaiu Bistro</h1>
            </Link>
            <nav className="flex gap-4">
              <Link to="/" className="text-sm font-medium text-gray-600 hover:text-accent transition-colors">Bookings</Link>
              <Link to="/chat" className="text-sm font-medium text-gray-600 hover:text-accent transition-colors">AI Agent</Link>
            </nav>
          </div>
        </header>

        {/* Routes */}
        <main className="py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/details/:id" element={<BookingDetails />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;