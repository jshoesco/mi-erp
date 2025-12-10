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
        // PALETA JS SHOES
        brand: {
          red: '#D50000',      // Rojo Marca (Acciones, Alertas, Precios)
          dark: '#0F0F0F',     // Negro Profundo (Barra Lateral, Textos Fuertes)
          gray: '#27272A',     // Gris Elegante (Hover, Fondos secundarios)
          light: '#F3F4F6',    // Gris muy claro (Fondo general, para no usar blanco puro)
        },
        // Reemplazamos el 'indigo' (morado) por un gris azulado profesional o rojo
        indigo: {
          50: '#F8FAFC',
          100: '#F1F5F9', // Gris muy suave
          200: '#E2E8F0',
          500: '#D50000', // TRUCO: Si algo pide indigo-500, saldrá ROJO.
          600: '#B91C1C',
          700: '#991B1B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.1)',
        'float': '0 10px 30px -10px rgba(213, 0, 0, 0.2)', // Sombra roja suave
      }
    },
  },
  plugins: [],
}