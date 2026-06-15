import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/pages/**/*.{ts,tsx}",
    "./app/components/**/*.{ts,tsx}",
    "./app/lib/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: "#0A0B0D",
        surface: "#14161A",
        input: "#1E2127",
        border: "#2A2E37",
        foreground: "#E7E9EC",
        muted: "#878D99",
        accent: "#C6F24E",
        "accent-2": "#7C5CFF",
        positive: "#34D399",
        negative: "#F25C5C"
      },
      boxShadow: {
        card: "0 14px 34px rgba(0, 0, 0, 0.24)",
        glow: "0 0 36px rgba(198, 242, 78, 0.18)",
        panel: "0 18px 50px rgba(0, 0, 0, 0.28)",
        soft: "0 8px 22px rgba(198, 242, 78, 0.12)"
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateX(-110%)" },
          "100%": { transform: "translateX(110%)" }
        }
      },
      animation: {
        scan: "scan 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
