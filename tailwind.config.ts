import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#D4A96A',
        gold: '#E8A020',
        'dark-gold': '#B8760A',
        charcoal: '#2C2C2A',
        'dark-charcoal': '#1A1A18',
        cream: '#F5F0E8',
        silver: '#C0C0C0',
        'silver-light': '#DADCE1',
        platinum: '#6B5B9E',
        bronze: '#8B5E3C',
        'bg-start': '#7A2E0E',
        'bg-end': '#5C1F08',
        card: '#8B3A14',
        'border-gold': '#E8A020',
        terracotta: '#7A2E0E',
      },
      fontFamily: {
        display: ['Hunters', 'Georgia', 'serif'],
        body: ['Poppins', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(180deg, #7A2E0E 0%, #5C1F08 100%)',
        'card-gradient': 'linear-gradient(180deg, #8B3A14 0%, #6B2A0F 100%)',
      },
      keyframes: {
        'token-place': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'mill-pulse': {
          '0%, 100%': { filter: 'drop-shadow(0 0 0 #E8A020)' },
          '50%': { filter: 'drop-shadow(0 0 12px #E8A020)' },
        },
        'token-remove': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 160, 32, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232, 160, 32, 0)' },
        },
      },
      animation: {
        'token-place': 'token-place 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'mill-pulse': 'mill-pulse 800ms ease-in-out 2',
        'token-remove': 'token-remove 220ms ease-in forwards',
        'pulse-gold': 'pulse-gold 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
