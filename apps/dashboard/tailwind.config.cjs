const path = require('path');

module.exports = {
  content: [
    path.resolve(__dirname, 'index.html'),
    path.resolve(__dirname, '*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, 'components/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, 'services/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, 'supabase/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, 'utils/**/*.{js,ts,jsx,tsx}')
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
