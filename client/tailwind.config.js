/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mandi: {
          blue: '#2874F0',
          'blue-dark': '#1b5bc5',
          navy: '#172337',
          green: '#18864B',
          'green-dark': '#126639',
          'green-light': '#E8F5E9',
          discount: '#388E3C',
          bg: '#F1F3F6',
          text: '#212121',
          muted: '#878787',
          border: '#E0E0E0',
          warning: '#FF9F00',
          danger: '#FB641B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 4px 0 rgba(0,0,0,.08)',
        hover: '0 4px 12px 0 rgba(0,0,0,.15)',
        header: '0 1px 2px 0 rgba(0,0,0,.1)'
      }
    },
  },
  plugins: [],
}
