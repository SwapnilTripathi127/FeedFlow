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
        background: "#09090B",
        foreground: "#FAFAFA",
        surface: "#18181B",
        muted: "#A1A1AA",
        border: {
          muted: "#27272A",
          active: "#3F3F46"
        },
        iris: {
          light: "#A78BFA",
          DEFAULT: "#7C3AED",
          dark: "#6D28D9"
        },
        emerald: "#10B981",
        coral: "#F43F5E"
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
