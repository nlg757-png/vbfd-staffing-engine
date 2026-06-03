/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#080c10",
          panel:   "#0d1117",
          row:     "#0a0f14",
        },
        bd: {
          DEFAULT: "#1a2030",
        },
        txt: {
          primary: "#e2e8f0",
          muted:   "#475569",
          dim:     "#334155",
        },
        mho:    "#f97316",
        filled: "#22c55e",
        alert:  "#dc2626",
        warn:   "#d97706",
        info:   "#60a5fa",
        mhoG:   "#a78bfa",
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
        sans: ['"IBM Plex Sans"', "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

