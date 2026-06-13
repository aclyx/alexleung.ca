import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

const config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        white: "#fff",
        hover: "#718093",
        black: "#2f3640",
        highlight: "#00D131",
        accent: {
          link: "#60a5fa", // blue-400
          "link-hover": "#93c5fd", // blue-300
          secondary: "#f59e0b", // amber-500
          "secondary-hover": "#fbbf24", // amber-400
          "secondary-soft": "#fde68a", // amber-200
          success: "#86efac", // green-300
          warning: "#fcd34d", // yellow-300
          info: "#93c5fd", // blue-300
          primary: "#2563eb", // blue-600
          "primary-hover": "#1d4ed8", // blue-700
        },
      },
      fontFamily: {
        lato: ["Lato", "sans-serif"],
      },
      maxWidth: {
        content: "1170px",
      },
      transitionProperty: {
        all: "all",
      },
      transitionDuration: {
        200: "0.2s",
        500: "0.5s",
      },
      transitionTimingFunction: {
        linear: "linear",
        "expo-out": EXPO_OUT,
      },
      keyframes: {
        showTopText: {
          "0%": {
            transform: "translateY(20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
      },
      animation: {
        showTopText: `showTopText 0.8s ${EXPO_OUT} forwards`,
      },

      typography: {
        DEFAULT: {
          css: {
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
