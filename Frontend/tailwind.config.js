/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          900: "#0F0F12",
          800: "#18181C"
        },
        almond: "#F5F1E8"
      },
      boxShadow: {
        glass: "0 12px 40px rgba(0, 0, 0, 0.35)",
        neonBlue: "0 0 25px rgba(59,130,246,0.4)",
        neonPurple: "0 0 25px rgba(168,85,247,0.4)",
        neonEmerald: "0 0 25px rgba(16,185,129,0.35)",
        neonAmber: "0 0 25px rgba(245,158,11,0.35)"
      }
    }
  },
  plugins: [],
}

