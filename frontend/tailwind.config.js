module.exports = {
  content: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  safelist: [
    /* any tailwind classes that you using inside of ${} string interpolation you need to put here,
    or the classes will be purged from tailwind when the static files are built. probably half
    of these are useless because I was just copy pasting them from classnames without checking if
    they were static first */
    "w-full",
    "bg-foreground",
    "bg-foregroundHover",
    "dark:bg-darkmodeForegroundHover",
    "dark:bg-darkmodeForeground",
    "hover:bg-foregroundHover",
    "dark:hover:bg-darkmodeForegroundHover",
    "text-center",
    "flex",
    "items-center",
    "justify-center",
    "font-normal",
    "border",
    "dark:border-stone-800",
    "px-1",
    "text-xs",
    "text-lg",
    "rounded",
    "py-1",
    "dark:text-white",
    "px-0",
    "bg-transparent",
    "relative",
    "icon-btn-active",
    "mr-0.5",
    "mb-0.5",
    "tracking-tight",
    "mb-1",
    "mb-2",
    "bg-amber-600",
    "bg-stone-300",
    "btn",
    "italic",
    "hidden",
    "flex-col",
    "items-end",
    "items-start",
    "text-left",
    "text-right",
    "flex-row-reverse",
    "pr-0.5",
    "pl-1",
    "pl-2",
    "p-2",
    "md:pl-2",
    "pr-1",
    "p-0.5",
    "px-1.5",
    "pl-0.5",
    "gap-0.5",
    "gap-1",
    "gap-2",
    "gap-4",
    "my-auto",
    "drop-shadow",
    "text-stone-200",
    "dark:text-stone-200",
    "text-stone-400",
    "dark:text-stone-400",
    "text-stone-500",
    "dark:text-stone-400",
    "text-stone-400",
    "absolute",
    "text-md",
    "text-green-400",
    "text-stone-900",
    "text-green-500",
    "dark:text-green-500",
    "font-extrabold",
    "leading-3",
    "leading-4",
    "bg-gray-900",
    "hover:bg-gray-600",
    "hover:bg-gray-800",
    "tracking-tighter",
    "border-white",
    "w-5",
    "h-5",
    "w-9",
    "h-9",
    "w-8",
    "h-8",
    "h-6",
    "border-black",
    "dark:border-white",
    "cursor-pointer",
    "rounded",
    "rounded-md",
    "mx-auto",
    "w-fit",
    "h-fit",
    "py-0.5",
    "rounded-full",
    "shadow-md",
    "z-30",
    "shadow",
    "bg-green-500",
    "whitespace-nowrap",
    "bg-zinc-800",
    "dark:bg-zinc-900",
    "border-b",
    "border-t",
    "border-stone-800",
    "text-rose-600",
    "font-bold",
    "items-between",
    "justify-between",
    "overflow-hidden",
    "grow",
    "text-gray-400",
    "hover:text-black",
    "dark:hover:text-white",
    "w-1/4",
    "w-1/2",
    "w-1/3",
    "container",
    "md:items-center",
    "sm:items-start",
    "mt-navheader",
    "border-1",
    "border-r",
    "border-stone-200",
    "shadow-xl",
    "max-w-gap",
    "border-stone-300",
    "dark:border-stone-800",
    "bg-neutral-900",
    "dark:bg-zinc-900",
    "border-zinc-800",
    "min-h-nav",
    "md:h-postHeight",
    "sm:flex-col",
    "md:flex",
    "md:flex-row-reverse",
    "md:flex-row",
    "justify-evenly",
    "font-Archivo",
    "sm:text-sm",
    "sm:text-xs",
    "md:text-lg",
    "sm:mx-auto",
    "md:mx-0",
    "sm:py-0",
    "pt-0",
    "pt-2",
    "sm:text-center",
    "md:text-right",
    "md:text-left",
    "flex-wrap",
    "md:justify-end",
    "md:justify-start",
    "mt-1",
    "font-rubik",
    "dark:text-white",
    "border-zinc-300",
    "dark:border-stone-800",
    "p-3",
    "rounded-sm",
  ],
  theme: {
    screens: {
      /*when you change any of this, go into the interface context
      in react and make sure the breakpoints match up there also*/
      sm: "512px",
      md: "570px",
      xl: "680px",
      xxl: "1024px",
      xxxl: "1280px",
    },
    extend: {
      minHeight: {
        header: "4.25rem",
        nav: "2.25rem",
        navheader: "6.5rem", //this should be nav+header height
        footer: "5rem",
      },
      width: {
        threadGap: "20%",
      },
      fontFamily: {
        rubik: '"Outfit"',
      },
      colors: {
        foreground: "white",
        foregroundHover: "rgb(249,249,255)",
        background: "white",
        foregroundContrast: "#17181a",
        darkmodeForeground: "#17181a",
        darkmodeForegroundHover: "#12141a",
        darkmodeBackground: "#17181a",
        darkmodeForegroundContrast: "#18181b",
      },
      height: {
        postHeight: "14.5em",
        postImageHeight: "13.366rem",
      },
      maxHeight: {
        asideMaxHeight: "calc(100vh - 8rem)",
        gap: "calc(100% - 1.5pc)",
      },
      minWidth: {
        postWidth: "15.5em",
      },
      maxWidth: {
        postWidth: "15/5em",
        gap: "min(calc(100% - 1.5pc), 30pc)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
