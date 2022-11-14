module.exports = {
  content: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      sm: "420px",
      md: "512px",
      xl: "768px",
    },
    extend: {
      minHeight: {
        header: "6rem",
        nav: "2.25rem",
        navheader: "8.25rem", //this should be nav+header height
      },
      width: {
        threadGap: "20%"
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
