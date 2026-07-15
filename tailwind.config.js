/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        orange: "#F2600C",
        orangeDark: "#C94E09",
        ink: "#151311",
        charcoal: "#221F1C",
        stone: "#2C2823",
        stoneLight: "#3A3530",
        cream: "#F5F0E6",
        moss: "#6E7A4F",
        muted: "#B7AFA2",
        hline: "#413C35",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
