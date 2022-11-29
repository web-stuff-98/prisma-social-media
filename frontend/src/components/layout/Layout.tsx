import { useEffect } from "react";
import { BsChevronCompactLeft, BsChevronCompactRight } from "react-icons/bs";
import { Outlet, useLocation } from "react-router-dom";
import useScrollbarSize from "react-scrollbar-size";
import { useInterface } from "../../context/InterfaceContext";
import Header from "./Header";
import Nav from "./Nav";

export default function Layout() {
  const { pathname } = useLocation();
  const { state: iState } = useInterface();
  const { width: scrollBarWidth } = useScrollbarSize();

  useEffect(() => {
    if (iState.darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [iState]);

  return (
    <div
      style={{
        backgroundImage: iState.darkMode
          ? "url(./bgt_dark.png)"
          : "url(./bgt.png)",
      }}
      className="w-screen font-rubik h-screen overflow-x-hidden text-black dark:text-white flex flex-col"
    >
      <div
        style={{ top: "0", zIndex: "99" }}
        className="sticky w-full shadow-md flex flex-col"
      >
        <Header />
        <Nav />
      </div>
      <main
        className={
          pathname.includes("/editor") || pathname.includes("/posts")
            ? "container mx-auto mt-navheader w-full h-screen bg-foreground dark:bg-darkmodeForeground border-l border-r border-stone-200 shadow dark:border-stone-800 px-2"
            : pathname === "/login" ||
              pathname === "/register" ||
              pathname === "/settings"
            ? "w-fit rounded my-auto shadow-xl mx-auto bg-foreground dark:bg-darkmodeForeground border border-stone-300 dark:border-stone-800"
            : "container mx-auto mt-navheader w-full h-screen"
        }
      >
        <Outlet />
      </main>
      <footer
        style={{
          bottom: "0",
          left: "0",
          width: `calc(100% - ${scrollBarWidth}px)`,
        }}
        className="fixed border-t flex shadow border-zinc-800 dark:border-stone-800 bg-neutral-900 dark:bg-zinc-900 min-h-footer"
      >
        <div className="flex mx-auto my-auto text-4xl">
          <BsChevronCompactLeft />
          0
          <BsChevronCompactRight />
        </div>
      </footer>
    </div>
  );
}

//bg-background dark:bg-darkmodeBackground
