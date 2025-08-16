/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        // replace the default sans
        sans: ["Montserrat", "ui-sans-serif", "system-ui"],
      },
      colors: {
        "brand-blue": "#3b82f6",
        "brand-blue-dark": "#2563eb",
      },
    },
  },
  plugins: [],
};