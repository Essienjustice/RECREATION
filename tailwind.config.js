/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        studio: {
          bg: "#0A0A0F",
          card: "#13131F",
          card2: "#171725",
          input: "#0F0F18",
          line: "rgba(255,255,255,0.08)",
          muted: "#A8ACBA",
          text: "#F8FAFC",
          green: "#10B981"
        }
      },
      boxShadow: {
        lift: "0 18px 50px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(16,185,129,0.55), 0 0 34px rgba(16,185,129,0.18)",
        primary: "0 18px 42px rgba(37,99,235,0.22)"
      },
      keyframes: {
        "soft-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "soft-in": "soft-in 220ms ease-out"
      }
    }
  },
  plugins: []
};
