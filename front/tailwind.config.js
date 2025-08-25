/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light mode colors
        primary: {
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
        // Dark mode custom colors
        dark: {
          bg: "#0f172a", // Dark background
          card: "#1e293b", // Dark card background
          border: "#334155", // Dark border color
          text: "#f1f5f9", // Dark text color
          muted: "#94a3b8", // Dark muted text
          accent: "#38bdf8", // Dark accent color
        },
      },
    },
  },
  plugins: [],
};
