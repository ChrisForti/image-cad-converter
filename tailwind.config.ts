/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Custom marine/yacht theme colors
        marine: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
      },
      backgroundImage: {
        "gradient-marine-light":
          "linear-gradient(135deg, #0ea5e9, #0284c7, #075985)",
        "gradient-marine-dark":
          "linear-gradient(135deg, #111827, #1f2937, #000000)",
      },
    },
  },
  plugins: [],
};
