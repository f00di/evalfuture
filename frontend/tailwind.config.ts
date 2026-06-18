import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1F33",
        slateFinance: "#334155",
        tealFinance: "#0F766E",
        goldFinance: "#D4AF37",
        creamFinance: "#F8FAF6",
        panelBlue: "#E7F0F7",
        inputAmber: "#FEF3C7",
        riskRed: "#B91C1C",
        positiveGreen: "#047857"
      },
      boxShadow: {
        panel: "0 14px 36px rgba(11, 31, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
