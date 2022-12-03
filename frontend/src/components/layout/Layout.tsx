import { createContext, useEffect, useRef, useState, useContext } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useFilter } from "../../context/FilterContext";
import { useInterface } from "../../context/InterfaceContext";
import Header from "./Header";
import Nav from "./Nav";

export const ScrollYContext = createContext({ scrollY: 0 });
export const ScrollToTopContext = createContext(() => {});
export const useScrollY = () => useContext(ScrollYContext);
export const useScrollToTop = () => useContext(ScrollToTopContext);

export default function Layout() {
  const location = useLocation();
  const { state: iState } = useInterface();
  const { maxPage, pageCount, fullCount } = useFilter();
  const navigate = useNavigate();
  const query = useParams();
  let [searchParams] = useSearchParams();

  useEffect(() => {
    if (iState.darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [iState]);

  const prevPage = () => {
    const term = searchParams.get("term");
    const tags = searchParams.get("tags");
    const preserveQuery = `${term ? `?term=${term}` : ""}${
      tags ? `${term ? "&" : "?"}tags=${tags}` : ""
    }`;
    navigate(`/blog/${Math.max(Number(query.page) - 1, 1)}${preserveQuery}`);
  };
  const nextPage = () => {
    const term = searchParams.get("term");
    const tags = searchParams.get("tags");
    const preserveQuery = `${term ? `?term=${term}` : ""}${
      tags ? `${term ? "&" : "?"}tags=${tags}` : ""
    }`;
    navigate(
      `/blog/${Math.min(Number(query.page) + 1, maxPage)}${preserveQuery}`
    );
  };

  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef) return;
    const onScroll = (e: any) => {
      if (containerRef.current) setScrollY(containerRef.current?.scrollTop);
    };
    containerRef.current?.addEventListener("scroll", onScroll);
    return () => containerRef.current?.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  const scrollToTop = () =>
    containerRef.current?.scrollTo({ top: 0, behavior: "auto" });

  return (
    <div
      style={{
        backgroundImage: iState.darkMode
          ? "url(/bgt_dark.png)"
          : "url(/bgt.png)",
        backgroundPositionY: `${Math.ceil(scrollY * -0.025)}px`,
      }}
      ref={containerRef}
      className="w-screen font-rubik h-screen overflow-x-hidden text-black dark:text-white flex flex-col"
    >
      <ScrollYContext.Provider value={{ scrollY }}>
        <ScrollToTopContext.Provider value={scrollToTop}>
          <div
            style={{ top: "0", zIndex: "99" }}
            className="sticky w-full shadow-md flex flex-col"
          >
            <Header />
            <Nav />
          </div>
          <div
            className={
              location.pathname.includes("/editor") ||
              location.pathname.includes("/posts")
                ? "my-auto h-full flex flex-col"
                : "my-auto"
            }
          >
            <main
              style={
                location.pathname === "/login" ||
                location.pathname === "/register" ||
                location.pathname === "/settings" ||
                location.pathname.includes("/profile") ||
                location.pathname === "/"
                  ? { marginTop: "0.75pc", marginBottom: "0.75pc" }
                  : {}
              }
              className={
                location.pathname.includes("/editor") ||
                location.pathname.includes("/posts")
                  ? "container mx-auto mt-navheader w-full grow bg-foreground dark:bg-darkmodeForeground border-l border-r border-stone-200 shadow dark:border-stone-800"
                  : location.pathname === "/login" ||
                    location.pathname === "/register" ||
                    location.pathname === "/settings" ||
                    location.pathname.includes("/profile") ||
                    location.pathname === "/"
                  ? "w-fit rounded my-auto shadow-xl mx-auto max-w-gap bg-foreground dark:bg-darkmodeForeground border border-stone-300 dark:border-stone-800"
                  : "container mx-auto mt-navheader w-full h-screen"
              }
            >
              <Outlet />
            </main>
          </div>
          {location.pathname.includes("/blog") && (
            <div
              style={{ bottom: "0" }}
              className="fixed flex items-center justify-center bg-neutral-900 dark:bg-zinc-900 border-t border-black dark:border-zinc-800 w-screen min-h-footer"
            >
              <BsChevronLeft
                onClick={() => prevPage()}
                className="text-white cursor-pointer text-3xl"
              />
              <div className="flex text-white flex-col items-center justify-center">
                <div style={{ lineHeight: "1" }} className="text-2xl">
                  {query.page}/{Math.ceil(fullCount / 20)}
                </div>
                <div style={{ lineHeight: "1" }}>
                  {pageCount}/{fullCount}
                </div>
              </div>
              <BsChevronRight
                onClick={() => nextPage()}
                className="text-white cursor-pointer text-3xl"
              />
            </div>
          )}
        </ScrollToTopContext.Provider>
      </ScrollYContext.Provider>
    </div>
  );
}
