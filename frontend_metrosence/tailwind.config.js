/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", './components/**/*.{js,jsx,ts,tsx}', ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        metro: {
          red: "#E4002B",
          line1: "#E31E24",
          line2: "#F3C300",
          line3: "#5A2D0C",
          line4: "#2E3A8C",
          line4a: "#0E79B2",
          line5: "#00A965",
          line6: "#7E3BAE",
          chip: "#F3F4F6",
        },
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
}

