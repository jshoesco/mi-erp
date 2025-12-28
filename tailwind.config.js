/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D50000',      // Rojo Principal
          dark: '#0F0F0F',     // Negro Interfaz
          gray: '#27272A',     // Gris Acciones
          light: '#F3F4F6',    // Fondo General
          surface: '#FFFFFF',  // Color de Tarjetas/Modales
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -5px rgba(0, 0, 0, 0.05)',
        'float': '0 10px 30px -10px rgba(213, 0, 0, 0.2)',
      },
      borderRadius: {
        'capsule': '2rem',
        'inner': '1.2rem',
      }
    },
  },
  plugins: [],
}