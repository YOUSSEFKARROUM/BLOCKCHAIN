import type { Config } from "tailwindcss";

// Jetons du design « Tableau des départs » (voir globals.css pour les variables CSS).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#09090A",
        amber: { DEFAULT: "#FFB800", hi: "#FFD04A" },
        ticket: "#F2F0E8",
        tile: { DEFAULT: "#232326", 2: "#1C1C1F" },
        gray: "#A9A9B2",
        soft: "#D9D7CF",
        ok: "#4CD964",
        alert: "#FF6A3D",
        line: "#5A5A62",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      maxWidth: { board: "1328px" },
    },
  },
  plugins: [],
};

export default config;
