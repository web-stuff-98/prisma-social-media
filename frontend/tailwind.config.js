module.exports = {
  content: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      sm: "380px",
      md: "480px",
      lg: "620px",
      xl: "768px",
    },
    extend: {
      minHeight: {
        header: "6rem",
        nav: "2.5rem",
        navheader: "8.5rem", //this should be nav+header height
      },
      width: {
        threadGap: "20%"
      }
    },
  },
  plugins: [],
};
