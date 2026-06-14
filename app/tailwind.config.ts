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
        border: "hsl(222 18% 22%)",
        background: "hsl(222 30% 7%)",
        foreground: "hsl(210 40% 96%)",
        card: "hsl(215 24% 12%)",
        muted: "hsl(222 22% 14%)",
        "muted-foreground": "hsl(214 14% 68%)",
        accent: "hsl(204 100% 54%)",
        "accent-foreground": "hsl(210 40% 98%)",
        danger: "hsl(348 84% 62%)"
      },
      boxShadow: {
        card: "0 14px 34px rgba(0, 0, 0, 0.24)",
        glow: "0 0 36px rgba(20, 153, 255, 0.18)",
        panel: "0 18px 50px rgba(0, 0, 0, 0.28)",
        soft: "0 8px 22px rgba(20, 153, 255, 0.22)"
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
