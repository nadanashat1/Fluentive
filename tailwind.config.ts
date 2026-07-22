import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#8b0b45",
          dark: "#6f0837",
          light: "#f7edf2"
        },
        slateText: "#2a2a2a",
        muted: "#6f7380",
        borderSoft: "#ececef",
        panel: "#f7f7f9"
      },
      boxShadow: {
        card: "0 8px 24px rgba(18, 20, 31, 0.06)",
        button: "0 8px 16px rgba(139, 11, 69, 0.25)"
      },
      borderRadius: {
        soft: "10px",
        lg2: "14px"
      }
    }
  },
  plugins: []
};

export default config;
