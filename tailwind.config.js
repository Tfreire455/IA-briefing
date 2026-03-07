/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#040C18', surface: '#081425', s2: '#0C1E38', s3: '#102845',
          blue: '#0EA5E9', bright: '#38BDF8', dim: '#0369A1',
          cyan: '#06EEF5', cdim: '#00B4D8',
          text: '#CBD5E1', tbright: '#E2EBF4', tmuted: '#4A6A8A',
        },
      },
    },
  },
  plugins: [],
};
