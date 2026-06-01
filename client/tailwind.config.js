/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0D0D0D',
        'text-light': '#F0EDE6',
        'accent-amber': '#E8A020',
        'border-dark': '#222',
      },
      fontFamily: {
        'syne': ['Syne', 'sans-serif'],
        'serif': ['Instrument Serif', 'serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}