import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Nav from "./Nav";
export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="w-screen h-screen overflow-x-hidden flex flex-col">
      <Header />
      <Nav />
      <main
        className={
          pathname === "/login" || pathname === "/register"
            ? "w-fit p-2 rounded my-auto shadow-xl mx-auto bg-white border"
            : "container mx-auto pt-navheader h-screen"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
