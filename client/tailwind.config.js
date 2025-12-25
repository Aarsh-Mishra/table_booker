/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2c3e50', // Professional Dark Blue
        accent: '#3498db',  // Vibrant Blue
        danger: '#e74c3c',  // Red for actions
        success: '#27ae60', // Green for status
      }
    },
  },
  plugins: [],
}