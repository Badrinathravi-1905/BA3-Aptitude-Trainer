export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { ink: { DEFAULT: "#070A13", 800: "#0E1322", 700: "#161C31" } },
      boxShadow: { card: "0 10px 40px -12px rgba(0,0,0,.6)", glow: "0 0 40px -8px rgba(99,102,241,.55)" },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "sans-serif"] },
    },
  },
  plugins: [],
};
