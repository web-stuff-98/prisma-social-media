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
        footer: "5rem"
      },
      width: {
        threadGap: "20%",
      },
      fontFamily: {
        rubik: '"DM Sans"',
      },
      colors: {
        foreground: "white",
        background: "white",
        foregroundContrast: "#17181a",
        darkmodeForeground: "#17181a",
        darkmodeBackground: "#17181a",
        darkmodeForegroundContrast: "#18181b"
      },
      height: {
        postHeight: "15em",
        postImageHeight: "13.875rem",
      },
      maxHeight: {
        asideMaxHeight: "calc(100vh - 8rem)",
        gap: "calc(100% - 1.5pc)"
      },
      minWidth: {
        postWidth: "15.5em",
      },
      maxWidth: {
        postWidth: "15/5em",
        gap: "min(calc(100% - 1.5pc), 30pc)"
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
