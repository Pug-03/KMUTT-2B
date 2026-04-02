/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        damaged: '#ef4444',
        old: '#f59e0b',
        ripe: '#22c55e',
        unripe: '#3b82f6',
      },
    },
  },
  plugins: [],
};
