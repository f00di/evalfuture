import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1F33",
        darkBlue: "#102A43",
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
        panel: "var(--shadow-panel)"
      },
      borderRadius: {
        control: "var(--radius-control)",
        panel: "var(--radius-panel)"
      }
    }
  },
  plugins: []
};

export default config;
