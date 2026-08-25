/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1a17",
        parchment: "#f6f1e7",
        moss: "#3c5b41",
        mossdark: "#294130",
        rust: "#c1502e",
        gold: "#c99a3d",
        clay: "#e7ddc8",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Work Sans'", "sans-serif"],
        mono: ["'Space Mono'", "monospace"],
      },
      boxShadow: {
        stamp: "0 2px 0 0 rgba(28,26,23,0.9)",
      },
    },
  },
  plugins: [],
};
