import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hello! I am the Vaiu Bistro Assistant. I can help you book a table. What date and time would you like?" }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle');
  const [bookingDetails, setBookingDetails] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude }),
        (err) => console.log("Location denied")
      );
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser does not support voice.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setStatus('listening'); };
    recognition.onend = () => { setIsListening(false); if (status === 'listening') setStatus('idle'); };
    recognition.onresult = (event) => handleSendMessage(event.results[0][0].transcript);
    recognition.start();
  };

  const handleSendMessage = async (userText) => {
    if (!userText.trim()) return;
    const newMessages = [...messages, { sender: 'user', text: userText }];
    setMessages(newMessages);
    setStatus('processing');

    try {
      const response = await api.post('/chat', { message: userText, history: newMessages, userLocation });
      const aiData = response.data;
      
      setBookingDetails(aiData.bookingDetails || {});
      setMessages(prev => [...prev, { sender: 'bot', text: aiData.reply }]);
      speak(aiData.reply);

      if (aiData.intent === 'confirmed') {
        handleAutoSave(aiData.bookingDetails);
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleAutoSave = async (details) => {
    try {
      await api.post('/bookings', {
        customerName: details.name || "Guest",
        numberOfGuests: details.guests || 2,
        bookingDate: details.date || new Date(),
        bookingTime: details.time || "19:00",
        cuisinePreference: details.cuisine || "Any",
        specialRequests: details.specialRequests || "None",
        seatingPreference: details.seating || "Any",
        status: "Confirmed"
      });
      const successMsg = "Booking confirmed! Redirecting...";
      setMessages(prev => [...prev, { sender: 'bot', text: successMsg }]);
      speak(successMsg);
      setTimeout(() => navigate('/'), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-100px)] flex flex-col">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-1 border border-gray-200">
        <div className="w-1/3 bg-gray-50 border-r border-gray-100 p-6 hidden md:block">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Live Context</h4>
          <div className="space-y-4">
            {Object.entries({Name: 'name', Date: 'date', Time: 'time', Guests: 'guests'}).map(([label, key]) => (
              <div key={key}>
                <span className="text-gray-400 text-xs block">{label}</span>
                <span className="font-medium text-gray-700">{bookingDetails[key] || '---'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user' ? 'bg-accent text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 border-t border-gray-100 flex flex-col items-center bg-gray-50">
            <button 
              onClick={startListening}
              disabled={status === 'processing' || status === 'speaking'}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isListening ? 'bg-red-500 animate-pulse ring-4 ring-red-200' : 'bg-primary hover:bg-gray-700'
              }`}
            >
              <span className="text-2xl">{isListening ? '🛑' : 'mic'}</span>
            </button>
            <p className="mt-3 text-xs font-medium text-gray-400 uppercase tracking-widest">{status}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;