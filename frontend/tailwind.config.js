export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563EB',
          600: '#1d4ed8',
          700: '#1d4ed8',
        },
        surface: {
          light: '#F1F5F9',
          dark: '#1E293B',
        },
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.14)',
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};