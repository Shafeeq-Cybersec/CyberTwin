/** @type {import('tailwindcss').Config} */
// Dark enterprise cybersecurity theme palette
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base surfaces — deep navy/charcoal for SOC dashboard feel
        surface: {
          950: "#0a0e17",
          900: "#0d1220",
          800: "#131a2b",
          700: "#1b2438",
          600: "#243049",
        },
        // Accent — cyber cyan
        accent: {
          DEFAULT: "#22d3ee",
          dim: "#0e7490",
          glow: "#67e8f9",
        },
        // Severity colors for findings
        severity: {
          critical: "#f43f5e",
          high: "#fb923c",
          medium: "#facc15",
          low: "#4ade80",
          info: "#60a5fa",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(34, 211, 238, 0.15)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        // Used for smooth page transitions
        "fade-in": "fadeIn 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
