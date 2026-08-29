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
        black: "#20231f",
        paper: "#f4f1e9",
        surface: "#fbfaf6",
        ink: "#20231f",
        muted: "#62675f",
        line: "#d8d2c6",
        accent: {
          link: "#52634d",
          "link-hover": "#3f4d3b",
          secondary: "#66715e",
          "secondary-hover": "#52634d",
          "secondary-soft": "#e2e6dd",
          success: "#39714c",
          warning: "#80571d",
          info: "#315f70",
          primary: "#52634d",
          "primary-hover": "#3f4d3b",
        },
      },
      maxWidth: {
        content: "1120px",
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
