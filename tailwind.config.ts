import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#01FF48",
          50: "#E6FFF0",
          100: "#CCFFE1",
          200: "#99FFC3",
          300: "#66FFA5",
          400: "#33FF87",
          500: "#01FF48",
          600: "#00CC3A",
          700: "#00992B",
          800: "#00661D",
          900: "#00330E",
        },
        // Semantic theme colors
        bg: "var(--bg)",
        card: "var(--card)",
        border: "var(--border)",
        muted: "var(--muted)",
        text: "var(--text)",
        subtext: "var(--subtext)",
        // Legacy support (optional)
        dark: {
          bg: "var(--bg)",
          card: "var(--card)",
          border: "var(--border)",
          muted: "var(--muted)",
          text: "var(--text)",
          subtext: "var(--subtext)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        arabic: ["var(--font-cairo)", "Cairo", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient":
          "linear-gradient(to right, var(--bg) 40%, transparent 100%)",
        "card-gradient":
          "linear-gradient(to top, var(--bg) 0%, transparent 60%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "pulse-green": "pulseGreen 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseGreen: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px #01FF48, 0 0 10px #01FF48" },
          "100%": { boxShadow: "0 0 20px #01FF48, 0 0 40px #01FF48" },
        },
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
