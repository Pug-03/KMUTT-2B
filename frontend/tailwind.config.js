/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Apple-style grade colors
        gradeA: '#34c759',
        gradeB: '#0a84ff',
        gradeC: '#ff9f0a',
        unripe: '#a8d830',
        rotten: '#ff453a',
        wilted: '#bf5af2',
        // Apple system colors
        'apple-blue': '#0a84ff',
        'apple-green': '#34c759',
        'apple-red': '#ff453a',
        'apple-orange': '#ff9f0a',
        'apple-purple': '#bf5af2',
        'apple-teal': '#5ac8fa',
        // Semantic (CSS variable based)
        base: 'var(--bg-base)',
        elevated: 'var(--bg-elevated)',
        card: 'var(--bg-card)',
        'card-solid': 'var(--bg-card-solid)',
        'card-hover': 'var(--bg-card-hover)',
        input: 'var(--bg-input)',
        'input-solid': 'var(--bg-input-solid)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        accent: 'var(--accent)',
      },
      borderRadius: {
        'apple': '20px',
        'apple-sm': '14px',
        'apple-xs': '10px',
      },
      backdropBlur: {
        'apple': '20px',
      },
      animation: {
        'slide-in': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
