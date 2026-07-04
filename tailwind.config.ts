import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141F1B",
        panel: "#1B2A25",
        panelDeep: "#101815",
        line: "#2C4038",
        lineSoft: "#22332C",
        paper: "#EDEAE0",
        sage: "#8FA39A",
        gold: "#C99A4E",
        goldText: "#3A2A0F",
        rust: "#C1603F",
        rustSoft: "#2E211D",
        green: "#5B8266",
        slate: "#7C8DA6",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
