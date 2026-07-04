import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1420",
        surface: "#141B2A",
        surface2: "#1C2540",
        border: "#28324A",
        brand: {
          DEFAULT: "#2F6FED", // corporate HR blue
          light: "#5B8DEF",
          dark: "#1F4FBE",
        },
        accent: {
          teal: "#1FB6A6",
          amber: "#F5A623",
          rose: "#F2545B",
        },
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 30px -12px rgba(15, 23, 42, 0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
