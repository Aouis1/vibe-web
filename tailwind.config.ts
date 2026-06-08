import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vinyl: {
          black: '#1a1a1a',
          groove: '#2a2a2a',
          label: '#f5f0e8',
        },
      },
      animation: {
        'spin-lp': 'spin 5s linear infinite',
        'eq-bar': 'eqBar 0.8s ease-in-out infinite alternate',
      },
      keyframes: {
        eqBar: {
          '0%': { height: '4px' },
          '100%': { height: '100%' },
        },
      },
    },
  },
  plugins: [],
}

export default config
