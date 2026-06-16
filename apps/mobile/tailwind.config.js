/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#FFFFFF",
        surface: "#1C1C1E",
        surfaceElevated: "#2C2C2E",
        muted: "#8E8E93",
        border: {
          muted: "#38383A",
          active: "#48484A"
        },
        apple: {
          red: "#FA233B",
          pink: "#FF2D55",
          blue: "#0A84FF",
          purple: "#5E5CE6",
          teal: "#64D2FF"
        }
      },
      fontFamily: {
        sans: ["System"]
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px"
      }
    },
  },
  plugins: [],
}
