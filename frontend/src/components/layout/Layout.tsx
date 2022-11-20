import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useInterface } from "../../context/InterfaceContext";
import Header from "./Header";
import Nav from "./Nav";
export default function Layout() {
  const { pathname } = useLocation();
  const { state: iState } = useInterface();

  useEffect(() => {
    if (iState.darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [iState]);

  return (
    <div className="w-screen font-rubik h-screen overflow-x-hidden bg-background dark:bg-darkmodeBackground text-black dark:text-white flex flex-col">
      <div style={{ top: "0", zIndex:"99" }} className="sticky w-full shadow-md flex flex-col">
        <Header />
        <Nav />
      </div>
      <main
        className={
          pathname === "/login" || pathname === "/register"
            ? "w-fit p-2 rounded my-auto shadow-xl mx-auto bg-foreground dark:bg-darkmodeForeground border border-black dark:border-stone-800"
            : "container mx-auto mt-navheader h-screen"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
