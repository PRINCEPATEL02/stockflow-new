/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme:   { 
    extend: { 
      fontFamily: { sans: ["'DM Sans'", 'system-ui', 'sans-serif'] },
      padding: {
        'safe': 'env(safe-area-inset-bottom, 0px)',
      }
    } 
  },
  plugins: [],
}
