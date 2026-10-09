import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

const config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "#fff",
        black: "#202936",
        paper: "#faf9f5",
        surface: "#ffffff",
        ink: "#202936",
        muted: "#58616d",
        line: "#d3d5d5",
        "control-border": "#858c95",
        canvas: "#030712",
        accent: {
          link: "#285296",
          "link-hover": "#1d3d72",
          secondary: "#58616d",
          "secondary-hover": "#202936",
          "secondary-soft": "#e8edf4",
          success: "#39714c",
          warning: "#80571d",
          info: "#315f70",
          primary: "#285296",
          "primary-hover": "#1d3d72",
        },
      },
      maxWidth: {
        content: "1120px",
      },
      fontFamily: {
        serif: ["Georgia", '"Times New Roman"', "serif"],
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
