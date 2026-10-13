/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
        brand: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f5a524',
          600: '#d97706',
        },
        // Chart series colours, validated for colour-blind separation on the
        // dark card surface. Fixed per entity across the app.
        series: {
          current: '#3987e5',
          savings: '#d95926',
          invest: '#199e70',
        },
        status: {
          good: '#0ca30c',
          warning: '#fab219',
          critical: '#d03b3b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        floatIn: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        floatIn: 'floatIn 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
