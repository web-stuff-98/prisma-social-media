module.exports = {
  content: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    screens: {
      sm: "512px",
      md: "620px",
      xl: "768px",
    },
    extend: {
      minHeight: {
        header: "4.25rem",
        nav: "2.25rem",
        navheader: "6.5rem", //this should be nav+header height
      },
      width: {
        threadGap: "20%",
      },
      fontFamily: {
        rubik: '"Archivo"',
      },
      colors: {
        foreground: "white",
        background: "white",
        foregroundContrast: "#17181a",
        darkmodeForeground: "#17181a",
        darkmodeBackground: "#17181a",
        darkmodeForegroundContrast: "#18181b"
      }
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
