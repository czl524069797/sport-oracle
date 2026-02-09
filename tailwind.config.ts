import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neon: {
          cyan: "#00f0ff",
          blue: "#3b82f6",
          orange: "#f97316",
          green: "#00ff88",
          purple: "#a855f7",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)",
      },
      boxShadow: {
        "neon-cyan": "0 0 15px rgba(0, 240, 255, 0.15), 0 0 30px rgba(0, 240, 255, 0.05)",
        "neon-cyan-lg": "0 0 20px rgba(0, 240, 255, 0.25), 0 0 40px rgba(0, 240, 255, 0.1)",
        "neon-orange": "0 0 15px rgba(249, 115, 22, 0.15), 0 0 30px rgba(249, 115, 22, 0.05)",
        "neon-green": "0 0 15px rgba(0, 255, 136, 0.15), 0 0 30px rgba(0, 255, 136, 0.05)",
        "neon-purple": "0 0 15px rgba(168, 85, 247, 0.15), 0 0 30px rgba(168, 85, 247, 0.05)",
      },
      animation: {
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "bounce-ball": "bounce-ball 1.5s ease-in-out infinite",
        "grid-shift": "grid-shift 20s linear infinite",
        "data-stream": "data-stream 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
