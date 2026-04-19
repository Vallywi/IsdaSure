export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3B82F6',
          600: '#1E3A8A',
          700: '#1E3A8A',
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